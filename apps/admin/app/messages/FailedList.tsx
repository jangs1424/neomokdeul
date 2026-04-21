"use client";

import { SendButton } from "./SendButton";

export type FailedRow = {
  logId: string;
  applicantName: string;
  phone: string;
  lastError: string;
  attemptCount: number;
  createdAt: string;
};

export function FailedList({ rows }: { rows: FailedRow[] }) {
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
        실패한 발송이 없습니다.
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
          gridTemplateColumns: "100px 130px 1fr 80px 140px 180px",
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
        <span>마지막 오류</span>
        <span>시도</span>
        <span>발송 시각</span>
        <span>재시도</span>
      </div>
      {rows.map((r) => (
        <div
          key={r.logId}
          style={{
            display: "grid",
            gridTemplateColumns: "100px 130px 1fr 80px 140px 180px",
            padding: "12px 12px",
            borderBottom: "1px solid var(--border)",
            fontSize: 13,
            color: "var(--text)",
            alignItems: "center",
            gap: 8,
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
          <span
            style={{
              color: "var(--danger)",
              fontSize: 12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={r.lastError}
          >
            {r.lastError}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
            {r.attemptCount}회
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
            {r.createdAt}
          </span>
          <span>
            <SendButton
              label="수동 재시도"
              variant="retry"
              logId={r.logId}
              small
            />
          </span>
        </div>
      ))}
    </div>
  );
}
