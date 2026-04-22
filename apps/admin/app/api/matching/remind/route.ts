import { NextResponse } from "next/server";
import {
  listApplications,
  listMatchResponses,
} from "@neomokdeul/db";
import { sendSms } from "../../../../lib/sms";
import { signAppToken, webappBaseUrl } from "../../../../lib/webapp-token";

/**
 * POST /api/matching/remind
 * Body: { cohortId }
 *
 * For every approved applicant in the cohort who has NOT submitted a
 * match_response yet, send a SMS reminder with a signed login link.
 *
 * NOTE: uses `sendSms` directly (no message_logs write). This is a reminder,
 * not the primary approval pipeline — we don't dedupe against message_logs.
 * TODO(phase-12): decide if reminders should also be logged to message_logs.
 */

type Body = { cohortId?: unknown };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const cohortId = typeof body.cohortId === "string" ? body.cohortId : "";
  if (!cohortId) {
    return NextResponse.json({ error: "cohortId required" }, { status: 400 });
  }

  const [apps, responses] = await Promise.all([
    listApplications(),
    listMatchResponses(cohortId),
  ]);
  const submitted = new Set(responses.map((r) => r.applicationId));
  const targets = apps.filter(
    (a) =>
      a.cohortId === cohortId &&
      a.status === "approved" &&
      !submitted.has(a.id),
  );

  if (targets.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, targets: 0 });
  }

  const base = webappBaseUrl();
  let sent = 0;
  let failed = 0;
  const failures: { applicationId: string; name: string; error: string }[] = [];

  for (const a of targets) {
    let link: string;
    try {
      const token = signAppToken(a.id, a.cohortId, 12);
      // Use /login?t=... → sets session cookie → home has match-form banner.
      // /match-form itself doesn't auto-login from a query token.
      link = `${base}/login?t=${token}`;
    } catch (err) {
      failed++;
      failures.push({
        applicationId: a.id,
        name: a.name,
        error: err instanceof Error ? err.message : "token sign failed",
      });
      continue;
    }

    const msg =
      `[너목들] ${a.name}님, 매칭 폼 제출이 아직이에요. ` +
      `오늘 23:59까지 작성 부탁드려요 →\n${link}`;

    const r = await sendSms(a.phone, msg);
    if (r.ok) {
      sent++;
    } else {
      failed++;
      failures.push({
        applicationId: a.id,
        name: a.name,
        error: r.error ?? "unknown error",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    targets: targets.length,
    sent,
    failed,
    failures,
  });
}
