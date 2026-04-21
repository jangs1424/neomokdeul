/**
 * SMS client — STUB implementation + shared send pipeline.
 *
 * Real Solapi integration will replace `sendSms`. The signature is stable:
 * callers import { sendSms } and get back { ok, providerMessageId?, error? }.
 *
 * Current behavior: 200ms simulated delay, 80% success / 20% failure so the
 * failure + retry path is exercised during development.
 */
import { getApplication, getCohort, getSupabaseAdmin } from "@neomokdeul/db";

export interface SendSmsResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export async function sendSms(phone: string, body: string): Promise<SendSmsResult> {
  await new Promise((r) => setTimeout(r, 200));
  if (Math.random() < 0.2) {
    return { ok: false, error: "simulated network failure" };
  }
  console.log("[SMS stub →]", phone, "\n", body, "\n---");
  return { ok: true, providerMessageId: "stub-" + Date.now() };
}

/**
 * Substitute {{name}}, {{cohort_name}}, {{payment_url}}, {{deadline}} in a template.
 * Leaves unrecognized {{vars}} intact (future-safe).
 */
export function renderTemplate(
  template: string,
  vars: { name: string; cohortName: string; paymentUrl: string; deadline: string },
): string {
  return template
    .replace(/\{\{\s*name\s*\}\}/g, vars.name)
    .replace(/\{\{\s*cohort_name\s*\}\}/g, vars.cohortName)
    .replace(/\{\{\s*payment_url\s*\}\}/g, vars.paymentUrl)
    .replace(/\{\{\s*deadline\s*\}\}/g, vars.deadline);
}

/**
 * Deadline policy: "결제 기한 D+3일" (applyClosesAt + 3 days, formatted as M월 D일 23:59).
 * Falls back to "D+3일 이내" if applyClosesAt is missing/invalid.
 */
export function formatDeadline(applyClosesAt: string | undefined): string {
  if (!applyClosesAt) return "D+3일 이내";
  const t = new Date(applyClosesAt);
  if (Number.isNaN(t.getTime())) return "D+3일 이내";
  t.setDate(t.getDate() + 3);
  const m = t.getMonth() + 1;
  const d = t.getDate();
  return `${m}월 ${d}일 23:59`;
}

export const DEFAULT_TEMPLATE =
  `[너목들] 안녕하세요 {{name}}님, {{cohort_name}} 참가 승인되셨어요.\n\n참가비 결제 링크:\n{{payment_url}}\n\n• 결제 기한: {{deadline}}\n• 결제 완료 시 OT 일정·오픈채팅 링크를 안내드릴게요`;

export type MessageLogStatus = "queued" | "sent" | "failed" | "retrying";

export interface MessageLogRow {
  id: string;
  application_id: string;
  cohort_id: string;
  phone: string;
  message_body: string;
  template_used: string | null;
  provider: string;
  provider_message_id: string | null;
  status: MessageLogStatus;
  attempt_count: number;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SendOutcome =
  | { kind: "sent"; log: MessageLogRow }
  | { kind: "failed"; log: MessageLogRow }
  | { kind: "skipped"; reason: string; applicationId: string }
  | { kind: "error"; message: string; applicationId: string };

/**
 * Attempt to send for an existing log row, with one automatic retry after 5s.
 * On success: marks log as sent + stamps applications.payment_link_sent_at.
 * On double failure: marks log as failed, attempt_count=2.
 */
async function attemptSendForLog(opts: {
  logId: string;
  applicationId: string;
  phone: string;
  body: string;
}): Promise<MessageLogRow> {
  const sb = getSupabaseAdmin();
  const first = await sendSms(opts.phone, opts.body);

  if (first.ok) {
    const nowIso = new Date().toISOString();
    const { data, error } = await sb
      .from("message_logs")
      .update({
        status: "sent",
        sent_at: nowIso,
        attempt_count: 1,
        provider_message_id: first.providerMessageId ?? null,
        last_error: null,
      })
      .eq("id", opts.logId)
      .select("*")
      .single();
    if (error) throw new Error(`[message_logs update sent] ${error.message}`);
    await sb
      .from("applications")
      .update({ payment_link_sent_at: nowIso })
      .eq("id", opts.applicationId);
    return data as MessageLogRow;
  }

  await sb
    .from("message_logs")
    .update({
      status: "retrying",
      attempt_count: 1,
      last_error: first.error ?? "unknown error",
    })
    .eq("id", opts.logId);

  await new Promise((r) => setTimeout(r, 5000));
  const second = await sendSms(opts.phone, opts.body);

  if (second.ok) {
    const nowIso = new Date().toISOString();
    const { data, error } = await sb
      .from("message_logs")
      .update({
        status: "sent",
        sent_at: nowIso,
        attempt_count: 2,
        provider_message_id: second.providerMessageId ?? null,
        last_error: null,
      })
      .eq("id", opts.logId)
      .select("*")
      .single();
    if (error) throw new Error(`[message_logs update sent-retry] ${error.message}`);
    await sb
      .from("applications")
      .update({ payment_link_sent_at: nowIso })
      .eq("id", opts.applicationId);
    return data as MessageLogRow;
  }

  const { data, error } = await sb
    .from("message_logs")
    .update({
      status: "failed",
      attempt_count: 2,
      last_error: second.error ?? "unknown error",
    })
    .eq("id", opts.logId)
    .select("*")
    .single();
  if (error) throw new Error(`[message_logs update failed] ${error.message}`);
  return data as MessageLogRow;
}

/**
 * Full single-send pipeline: validation → dedup → insert log → send → update log.
 * Shared by POST /api/messages/send and /api/messages/send-bulk.
 */
export async function sendMessageForApplication(
  applicationId: string,
  overrideBody?: string,
): Promise<SendOutcome> {
  try {
    const application = await getApplication(applicationId);
    if (!application) {
      return { kind: "error", message: "신청 내역을 찾을 수 없습니다", applicationId };
    }

    const cohort = await getCohort(application.cohortId);
    if (!cohort) {
      return { kind: "error", message: "기수를 찾을 수 없습니다", applicationId };
    }

    if (!cohort.latpeedPaymentUrl) {
      return {
        kind: "error",
        message: "Latpeed URL이 설정되지 않았습니다",
        applicationId,
      };
    }

    const sb = getSupabaseAdmin();

    const { data: existingSent, error: existingErr } = await sb
      .from("message_logs")
      .select("id")
      .eq("application_id", applicationId)
      .eq("status", "sent")
      .limit(1);
    if (existingErr) {
      return { kind: "error", message: existingErr.message, applicationId };
    }
    if (existingSent && existingSent.length > 0) {
      return { kind: "skipped", reason: "이미 발송됨", applicationId };
    }

    const template = cohort.approvedSmsTemplate ?? DEFAULT_TEMPLATE;
    const renderedBody =
      overrideBody ??
      renderTemplate(template, {
        name: application.name,
        cohortName: cohort.name,
        paymentUrl: cohort.latpeedPaymentUrl,
        deadline: formatDeadline(cohort.applyClosesAt),
      });

    const { data: inserted, error: insertErr } = await sb
      .from("message_logs")
      .insert({
        application_id: application.id,
        cohort_id: cohort.id,
        phone: application.phone,
        message_body: renderedBody,
        template_used: template,
        provider: "solapi",
        status: "queued",
        attempt_count: 0,
      })
      .select("*")
      .single();
    if (insertErr || !inserted) {
      return {
        kind: "error",
        message: insertErr?.message ?? "insert failed",
        applicationId,
      };
    }

    const finalRow = await attemptSendForLog({
      logId: (inserted as MessageLogRow).id,
      applicationId: application.id,
      phone: application.phone,
      body: renderedBody,
    });

    return finalRow.status === "sent"
      ? { kind: "sent", log: finalRow }
      : { kind: "failed", log: finalRow };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return { kind: "error", message, applicationId };
  }
}

/**
 * Retry pipeline for an existing failed log row (manual 수동 재시도).
 * Resets status to queued, then runs the two-attempt loop again; counters add.
 */
export async function retryMessageLog(logId: string): Promise<SendOutcome> {
  try {
    const sb = getSupabaseAdmin();
    const { data: existing, error } = await sb
      .from("message_logs")
      .select("*")
      .eq("id", logId)
      .maybeSingle();
    if (error || !existing) {
      return {
        kind: "error",
        message: error?.message ?? "log not found",
        applicationId: "",
      };
    }
    const row = existing as MessageLogRow;
    await sb
      .from("message_logs")
      .update({ status: "queued", last_error: null })
      .eq("id", logId);

    const finalRow = await attemptSendForLog({
      logId: row.id,
      applicationId: row.application_id,
      phone: row.phone,
      body: row.message_body,
    });
    return finalRow.status === "sent"
      ? { kind: "sent", log: finalRow }
      : { kind: "failed", log: finalRow };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return { kind: "error", message, applicationId: "" };
  }
}
