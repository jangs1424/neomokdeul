export const dynamic = "force-dynamic";
export const revalidate = 0;

import {
  getSupabaseAdmin,
  listApplications,
  listCohorts,
  type Application,
  type Cohort,
} from "@neomokdeul/db";
import {
  DEFAULT_TEMPLATE,
  formatDeadline,
  renderTemplate,
} from "../../lib/sms";
import { QueueTable, type QueueRow } from "./QueueTable";
import { FailedList, type FailedRow } from "./FailedList";

type Tab = "queue" | "sent" | "failed";

type MessageLogRow = {
  id: string;
  application_id: string;
  cohort_id: string;
  phone: string;
  message_body: string;
  status: "queued" | "sent" | "failed" | "retrying";
  attempt_count: number;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function tabLinkStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 16px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    border: "none",
    background: active ? "var(--accent)" : "transparent",
    color: active ? "#fff" : "var(--text-muted)",
    textDecoration: "none",
    display: "inline-block",
  };
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; cohort?: string }>;
}) {
  const { tab: tabParam, cohort: cohortParam } = await searchParams;
  const tab: Tab =
    tabParam === "sent" || tabParam === "failed" ? tabParam : "queue";
  const cohortFilter = cohortParam ?? "all";

  const sb = getSupabaseAdmin();
  const [apps, cohorts, logsRes] = await Promise.all([
    listApplications(),
    listCohorts(),
    sb.from("message_logs").select("*").order("created_at", { ascending: false }),
  ]);

  if (logsRes.error) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>문자 발송</h1>
        <div
          style={{
            marginTop: 16,
            padding: "16px 20px",
            background: "var(--warning-soft)",
            border: "1px solid var(--warning)",
            borderRadius: 8,
            fontSize: 13,
            color: "#92400e",
            lineHeight: 1.7,
          }}
        >
          <strong>DB 오류:</strong> {logsRes.error.message}
          <div style={{ marginTop: 8, fontSize: 12 }}>
            Supabase SQL editor에서{" "}
            <code>packages/db/supabase/migrations/0005_message_logs.sql</code> 를
            실행했는지 확인해주세요.
          </div>
        </div>
      </div>
    );
  }

  const logs = (logsRes.data ?? []) as MessageLogRow[];

  const cohortById = new Map<string, Cohort>(cohorts.map((c) => [c.id, c]));
  const appById = new Map<string, Application>(apps.map((a) => [a.id, a]));

  // Phones that have already been SENT successfully in the same cohort
  // → 중복 예외처리 (shouldn't appear in 발송 대기 even if someone re-approved them)
  const sentKeys = new Set<string>();
  for (const l of logs) {
    if (l.status === "sent") sentKeys.add(`${l.cohort_id}::${l.phone}`);
  }

  // --- Queue tab data ---
  const queueApps = apps.filter(
    (a) =>
      a.status === "approved" &&
      !appPaymentSent(a) &&
      !sentKeys.has(`${a.cohortId}::${a.phone}`) &&
      (cohortFilter === "all" || a.cohortId === cohortFilter),
  );

  const queueRows: QueueRow[] = queueApps.map((a) => {
    const c = cohortById.get(a.cohortId);
    const template = c?.approvedSmsTemplate ?? DEFAULT_TEMPLATE;
    const paymentUrl = c?.latpeedPaymentUrl ?? "";
    const rendered = renderTemplate(template, {
      name: a.name,
      cohortName: c?.name ?? "—",
      paymentUrl: paymentUrl || "[결제 링크 미설정]",
      deadline: formatDeadline(c?.applyClosesAt),
    });
    return {
      applicationId: a.id,
      name: a.name,
      phone: a.phone,
      cohortName: c?.name ?? "—",
      approvedAt: formatDateTime(a.updatedAt ?? a.createdAt),
      renderedBody: rendered,
      paymentUrlMissing: !paymentUrl,
    };
  });

  // --- Sent tab data ---
  const sentLogs = logs.filter(
    (l) =>
      l.status === "sent" &&
      (cohortFilter === "all" || l.cohort_id === cohortFilter),
  );

  // --- Failed tab data ---
  const failedLogs = logs.filter(
    (l) =>
      l.status === "failed" &&
      l.attempt_count >= 2 &&
      (cohortFilter === "all" || l.cohort_id === cohortFilter),
  );
  const failedRows: FailedRow[] = failedLogs.map((l) => {
    const a = appById.get(l.application_id);
    return {
      logId: l.id,
      applicantName: a?.name ?? "(삭제된 신청)",
      phone: l.phone,
      lastError: l.last_error ?? "알 수 없는 오류",
      attemptCount: l.attempt_count,
      createdAt: formatDateTime(l.created_at),
    };
  });

  const counts = {
    queue: apps.filter(
      (a) =>
        a.status === "approved" &&
        !appPaymentSent(a) &&
        !sentKeys.has(`${a.cohortId}::${a.phone}`),
    ).length,
    sent: logs.filter((l) => l.status === "sent").length,
    failed: logs.filter((l) => l.status === "failed" && l.attempt_count >= 2)
      .length,
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
        <a
          href="/"
          style={{ color: "var(--text-muted)", textDecoration: "none" }}
        >
          홈
        </a>
        {" / 문자 발송"}
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "var(--text)",
          margin: 0,
        }}
      >
        문자 발송
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          marginTop: 6,
          marginBottom: 20,
        }}
      >
        승인된 신청자에게 Latpeed 결제 링크를 포함한 안내 문자를 발송합니다. ·
        대기 {counts.queue} · 완료 {counts.sent} · 실패 {counts.failed}
      </p>

      {/* Tabs + cohort filter */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <a
            href={buildHref("queue", cohortFilter)}
            style={tabLinkStyle(tab === "queue")}
          >
            발송 대기 {counts.queue > 0 ? `(${counts.queue})` : ""}
          </a>
          <a
            href={buildHref("sent", cohortFilter)}
            style={tabLinkStyle(tab === "sent")}
          >
            발송 완료 {counts.sent > 0 ? `(${counts.sent})` : ""}
          </a>
          <a
            href={buildHref("failed", cohortFilter)}
            style={tabLinkStyle(tab === "failed")}
          >
            실패 {counts.failed > 0 ? `(${counts.failed})` : ""}
          </a>
        </div>

        <form method="get" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="hidden" name="tab" value={tab} />
          <label
            htmlFor="cohort-filter"
            style={{ fontSize: 12, color: "var(--text-muted)" }}
          >
            기수
          </label>
          <select
            id="cohort-filter"
            name="cohort"
            defaultValue={cohortFilter}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 12,
            }}
          >
            <option value="all">전체 기수</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            적용
          </button>
        </form>
      </div>

      {tab === "queue" && <QueueTable rows={queueRows} />}

      {tab === "sent" && (
        <SentList
          rows={sentLogs.map((l) => {
            const a = appById.get(l.application_id);
            const c = cohortById.get(l.cohort_id);
            return {
              id: l.id,
              applicantName: a?.name ?? "(삭제된 신청)",
              phone: l.phone,
              cohortName: c?.name ?? "—",
              sentAt: formatDateTime(l.sent_at ?? l.created_at),
              preview: truncate(l.message_body, 60),
              fullBody: l.message_body,
            };
          })}
        />
      )}

      {tab === "failed" && <FailedList rows={failedRows} />}
    </div>
  );
}

function buildHref(tab: Tab, cohort: string): string {
  const qs = new URLSearchParams();
  qs.set("tab", tab);
  if (cohort && cohort !== "all") qs.set("cohort", cohort);
  return `/messages?${qs.toString()}`;
}

function appPaymentSent(_a: Application): boolean {
  // `Application` type doesn't expose paymentLinkSentAt — we rely on message_logs
  // as the source of truth (sentKeys), so the payment-link timestamp is not
  // needed for filtering. Kept as a seam in case we surface it later.
  return false;
}

function SentList({
  rows,
}: {
  rows: {
    id: string;
    applicantName: string;
    phone: string;
    cohortName: string;
    sentAt: string;
    preview: string;
    fullBody: string;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: "48px 0",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 14,
          border: "1px solid var(--border)",
          borderRadius: 8,
        }}
      >
        발송된 문자가 없습니다.
      </div>
    );
  }
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "100px 130px 1fr 150px 1.5fr 90px",
          padding: "10px 12px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          gap: 8,
        }}
      >
        <span>이름</span>
        <span>전화</span>
        <span>기수</span>
        <span>발송일시</span>
        <span>메시지</span>
        <span>전체</span>
      </div>
      {rows.map((r) => (
        <details key={r.id}>
          <summary
            style={{
              display: "grid",
              gridTemplateColumns: "100px 130px 1fr 150px 1.5fr 90px",
              padding: "12px 12px",
              borderBottom: "1px solid var(--border)",
              fontSize: 13,
              color: "var(--text)",
              alignItems: "center",
              gap: 8,
              listStyle: "none",
              cursor: "pointer",
            }}
          >
            <span style={{ fontWeight: 500 }}>{r.applicantName}</span>
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: 12,
                fontFamily: "ui-monospace, Menlo, monospace",
              }}
            >
              {r.phone}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
              {r.cohortName}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
              {r.sentAt}
            </span>
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: 12,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.preview}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "var(--accent)",
                fontWeight: 500,
              }}
            >
              전체 보기 →
            </span>
          </summary>
          <div
            style={{
              padding: "16px 20px",
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: 12,
              color: "var(--text)",
              whiteSpace: "pre-wrap",
              lineHeight: 1.7,
            }}
          >
            {r.fullBody}
          </div>
        </details>
      ))}
    </div>
  );
}
