"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: string;
  variant?: "decide" | "revert";
};

const btnBase: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  fontSize: 12,
  cursor: "pointer",
};

export function ActionButtons({ id, variant = "decide" }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(status: "approved" | "rejected" | "pending") {
    setBusy(true);
    try {
      const res = await fetch(`/api/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } catch {
      alert("처리 실패");
    } finally {
      setBusy(false);
    }
  }

  if (variant === "revert") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          act("pending");
        }}
        style={{
          ...btnBase,
          border: "1px solid var(--border)",
          background: "#fff",
          color: "var(--text-muted)",
          opacity: busy ? 0.6 : 1,
        }}
      >
        되돌리기
      </button>
    );
  }

  return (
    <span
      style={{ display: "inline-flex", gap: 6 }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.preventDefault();
          act("approved");
        }}
        style={{
          ...btnBase,
          border: "none",
          background: "var(--accent)",
          color: "#fff",
          opacity: busy ? 0.6 : 1,
        }}
      >
        승인
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.preventDefault();
          act("rejected");
        }}
        style={{
          ...btnBase,
          border: "1.5px solid var(--danger)",
          background: "transparent",
          color: "var(--danger)",
          opacity: busy ? 0.6 : 1,
        }}
      >
        반려
      </button>
    </span>
  );
}
