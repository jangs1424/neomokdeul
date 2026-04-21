"use client";

import { useMemo, useState } from "react";
import { MessagePreview } from "./MessagePreview";
import { SendButton } from "./SendButton";

export type QueueRow = {
  applicationId: string;
  name: string;
  phone: string;
  cohortName: string;
  approvedAt: string;
  renderedBody: string;
  paymentUrlMissing: boolean;
};

export function QueueTable({ rows }: { rows: QueueRow[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedIds = useMemo(
    () =>
      rows
        .map((r) => r.applicationId)
        .filter((id) => selected[id] && !rowMissing(rows, id)),
    [selected, rows],
  );

  const allSelectable = rows.filter((r) => !r.paymentUrlMissing);
  const allChecked =
    allSelectable.length > 0 &&
    allSelectable.every((r) => selected[r.applicationId]);

  function toggleAll() {
    if (allChecked) {
      setSelected({});
    } else {
      const next: Record<string, boolean> = {};
      for (const r of allSelectable) next[r.applicationId] = true;
      setSelected(next);
    }
  }

  function toggleOne(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

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
        발송 대기 중인 신청이 없습니다.
      </div>
    );
  }

  return (
    <div>
      {selectedIds.length > 0 && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px",
            background: "var(--accent-soft)",
            border: "1px solid var(--accent)",
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 13,
            color: "#065f46",
            fontWeight: 500,
          }}
        >
          <span>{selectedIds.length}건 선택됨</span>
          <SendButton
            label="일괄 발송"
            variant="bulk"
            applicationIds={selectedIds}
          />
        </div>
      )}

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
            gridTemplateColumns: "36px 90px 130px 1fr 150px 100px 200px",
            padding: "10px 12px",
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            type="checkbox"
            aria-label="전체 선택"
            checked={allChecked}
            onChange={toggleAll}
          />
          <span>이름</span>
          <span>전화</span>
          <span>기수</span>
          <span>승인일시</span>
          <span>미리보기</span>
          <span>발송</span>
        </div>

        {rows.map((r) => {
          const checked = Boolean(selected[r.applicationId]);
          return (
            <div
              key={r.applicationId}
              style={{
                display: "grid",
                gridTemplateColumns: "36px 90px 130px 1fr 150px 100px 200px",
                padding: "12px 12px",
                borderBottom: "1px solid var(--border)",
                fontSize: 13,
                color: "var(--text)",
                alignItems: "center",
                gap: 8,
                background: checked ? "var(--accent-soft)" : "transparent",
              }}
            >
              <input
                type="checkbox"
                aria-label={`${r.name} 선택`}
                checked={checked}
                disabled={r.paymentUrlMissing}
                onChange={() => toggleOne(r.applicationId)}
              />
              <span style={{ fontWeight: 500 }}>{r.name}</span>
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
                {r.paymentUrlMissing && (
                  <span
                    style={{
                      marginLeft: 8,
                      padding: "1px 6px",
                      background: "var(--warning-soft)",
                      color: "#92400e",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    URL 없음
                  </span>
                )}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                {r.approvedAt}
              </span>
              <span>
                <MessagePreview
                  applicationId={r.applicationId}
                  applicantName={r.name}
                  phone={r.phone}
                  cohortName={r.cohortName}
                  renderedBody={r.renderedBody}
                  paymentUrlMissing={r.paymentUrlMissing}
                />
              </span>
              <span>
                <SendButton
                  label="발송"
                  variant="single"
                  applicationId={r.applicationId}
                  small
                  disabled={r.paymentUrlMissing}
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function rowMissing(rows: QueueRow[], id: string): boolean {
  return rows.find((r) => r.applicationId === id)?.paymentUrlMissing ?? false;
}
