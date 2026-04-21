"use client";

import { useState } from "react";

function maskPhone(phone: string): string {
  // Format: 010-****-1234 (mask middle 4 digits)
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  }
  // fallback: replace middle segment
  return phone.replace(/(\d{3})-?(\d{4})-?(\d{4})/, "$1-****-$3");
}

export function PhoneCell({ phone }: { phone: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {revealed ? phone : maskPhone(phone)}
      </span>
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        style={{
          fontSize: 11,
          padding: "1px 6px",
          border: "1px solid var(--border)",
          borderRadius: 4,
          background: "#fff",
          color: "var(--text-muted)",
          cursor: "pointer",
          lineHeight: 1.6,
        }}
      >
        {revealed ? "숨기기" : "보기"}
      </button>
    </span>
  );
}
