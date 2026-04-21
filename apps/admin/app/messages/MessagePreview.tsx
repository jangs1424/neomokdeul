"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

/**
 * Preview modal. Receives the already-rendered preview body + metadata from the
 * server component, so there's no duplicate template logic on the client.
 * The "이 메시지 발송" button hits /api/messages/send with the rendered body.
 */
export function MessagePreview({
  applicationId,
  applicantName,
  phone,
  cohortName,
  renderedBody,
  paymentUrlMissing,
}: {
  applicationId: string;
  applicantName: string;
  phone: string;
  cohortName: string;
  renderedBody: string;
  paymentUrlMissing: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const charCount = useMemo(() => renderedBody.length, [renderedBody]);
  const isLms = charCount > 90;

  async function send() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErr(json.error ?? "발송 실패");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          padding: "4px 10px",
          borderRadius: 6,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        미리보기
      </button>

      {open && (
        <div
          onClick={() => !busy && setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,24,39,0.45)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              width: "100%",
              maxWidth: 560,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                문자 미리보기
              </h2>
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                aria-label="닫기"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 18,
                  color: "var(--text-muted)",
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginBottom: 14,
                lineHeight: 1.7,
              }}
            >
              <div>
                수신: <span style={{ color: "var(--text)" }}>{applicantName}</span>{" "}
                ({phone})
              </div>
              <div>
                기수: <span style={{ color: "var(--text)" }}>{cohortName}</span>
              </div>
            </div>

            {paymentUrlMissing && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  background: "var(--warning-soft)",
                  color: "#92400e",
                  fontSize: 12,
                  marginBottom: 12,
                  border: "1px solid rgba(146, 64, 14, 0.2)",
                }}
              >
                이 기수에 Latpeed URL이 비어있습니다. 기수 편집에서 설정해주세요.
              </div>
            )}

            <div
              style={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 13,
                lineHeight: 1.7,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "14px 16px",
                whiteSpace: "pre-wrap",
                color: "var(--text)",
              }}
            >
              {renderedBody}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              <span>
                {charCount}자 · {isLms ? "LMS (장문)" : "SMS (단문)"}
              </span>
              <span>변수: {"{{name}} {{cohort_name}} {{payment_url}} {{deadline}}"}</span>
            </div>

            {err && (
              <div
                style={{
                  marginTop: 12,
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "var(--danger-soft, #fee2e2)",
                  color: "var(--danger)",
                  fontSize: 12,
                }}
              >
                {err}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                disabled={busy}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: 13,
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                닫기
              </button>
              <button
                type="button"
                onClick={send}
                disabled={busy || paymentUrlMissing}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: busy || paymentUrlMissing ? "not-allowed" : "pointer",
                  opacity: busy || paymentUrlMissing ? 0.55 : 1,
                }}
              >
                {busy ? "발송 중…" : "이 메시지 발송"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
