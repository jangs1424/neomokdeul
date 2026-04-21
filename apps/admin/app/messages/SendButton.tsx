"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Variant = "single" | "bulk" | "retry";

export function SendButton({
  label,
  variant,
  applicationId,
  applicationIds,
  logId,
  small,
  disabled,
}: {
  label: string;
  variant: Variant;
  applicationId?: string;
  applicationIds?: string[];
  logId?: string;
  small?: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    | { kind: "idle" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handle() {
    setBusy(true);
    setResult({ kind: "idle" });
    try {
      if (variant === "single") {
        if (!applicationId) throw new Error("applicationId 누락");
        const confirmed = window.confirm("이 신청자에게 문자를 발송하시겠어요?");
        if (!confirmed) {
          setBusy(false);
          return;
        }
        const res = await fetch("/api/messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId }),
        });
        const json = await res.json();
        if (res.ok && json.ok) {
          setResult({ kind: "success", message: "발송 완료" });
        } else {
          setResult({
            kind: "error",
            message: json.error ?? "발송 실패 (자동 재시도 포함)",
          });
        }
      } else if (variant === "bulk") {
        if (!applicationIds || applicationIds.length === 0)
          throw new Error("선택된 신청이 없습니다");
        const confirmed = window.confirm(
          `선택한 ${applicationIds.length}건을 순차 발송할까요?`,
        );
        if (!confirmed) {
          setBusy(false);
          return;
        }
        const res = await fetch("/api/messages/send-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationIds }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "bulk failed");
        setResult({
          kind: "success",
          message: `성공 ${json.sent} · 실패 ${json.failed} · 제외 ${json.skipped}${json.errored ? ` · 오류 ${json.errored}` : ""}`,
        });
      } else {
        if (!logId) throw new Error("logId 누락");
        const res = await fetch("/api/messages/retry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logId }),
        });
        const json = await res.json();
        if (res.ok && json.ok) {
          setResult({ kind: "success", message: "재시도 성공" });
        } else {
          setResult({
            kind: "error",
            message: json.error ?? "재시도 실패",
          });
        }
      }
      router.refresh();
    } catch (e) {
      setResult({
        kind: "error",
        message: e instanceof Error ? e.message : "알 수 없는 오류",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        disabled={busy || disabled}
        onClick={handle}
        style={{
          padding: small ? "4px 10px" : "8px 16px",
          borderRadius: 6,
          border: "none",
          background:
            variant === "retry" ? "var(--warning)" : "var(--accent)",
          color: "#fff",
          fontSize: small ? 12 : 13,
          fontWeight: 600,
          cursor: busy || disabled ? "not-allowed" : "pointer",
          opacity: busy || disabled ? 0.55 : 1,
        }}
      >
        {busy ? "처리 중…" : label}
      </button>
      {result.kind === "success" && (
        <span style={{ fontSize: 12, color: "var(--accent)" }}>
          ✓ {result.message}
        </span>
      )}
      {result.kind === "error" && (
        <span style={{ fontSize: 12, color: "var(--danger)" }}>
          ✗ {result.message}
        </span>
      )}
    </span>
  );
}
