"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ActionButtons({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(status: "approved" | "rejected") {
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

  return (
    <span style={{ display: "inline-flex", gap: 6 }}>
      <button
        disabled={busy}
        onClick={() => act("approved")}
        style={{
          padding: "6px 14px",
          borderRadius: 6,
          border: "none",
          background: "#1a4d2e",
          color: "#fff",
          fontSize: 12,
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        승인
      </button>
      <button
        disabled={busy}
        onClick={() => act("rejected")}
        style={{
          padding: "6px 14px",
          borderRadius: 6,
          border: "1.5px solid #e85d4d",
          background: "transparent",
          color: "#e85d4d",
          fontSize: 12,
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        반려
      </button>
    </span>
  );
}
