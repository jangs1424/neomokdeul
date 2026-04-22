"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Status = "all" | "pending" | "approved" | "rejected";

const TABS: { key: Status; label: string; color: string; bg: string }[] = [
  { key: "all",      label: "전체", color: "var(--text)",   bg: "var(--surface-2)" },
  { key: "pending",  label: "대기", color: "#92400e",       bg: "var(--warning-soft)" },
  { key: "approved", label: "승인", color: "#065f46",       bg: "var(--accent-soft)" },
  { key: "rejected", label: "반려", color: "#991b1b",       bg: "var(--danger-soft)" },
];

export function StatusTabs({
  counts,
}: {
  counts: { all: number; pending: number; approved: number; rejected: number };
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const active = (sp.get("status") as Status | null) ?? "all";

  function go(next: Status) {
    const p = new URLSearchParams(Array.from(sp.entries()));
    if (next === "all") p.delete("status");
    else p.set("status", next);
    router.push(`/applications?${p.toString()}`);
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 20,
        flexWrap: "wrap",
      }}
    >
      {TABS.map((t) => {
        const isActive = active === t.key;
        const count = counts[t.key];
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => go(t.key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              background: isActive ? t.bg : "var(--surface)",
              color: isActive ? t.color : "var(--text-muted)",
              border: isActive
                ? `1.5px solid ${t.color}22`
                : "1px solid var(--border)",
              cursor: "pointer",
              transition: "all 120ms",
              fontFamily: "inherit",
            }}
          >
            <span>{t.label}</span>
            <span
              style={{
                background: isActive ? "rgba(0,0,0,0.08)" : "var(--surface-2)",
                color: "inherit",
                padding: "1px 8px",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                minWidth: 20,
                textAlign: "center",
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
