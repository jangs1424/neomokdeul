"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useState, useCallback } from "react";

type Ctx = {
  selected: Set<string>;
  toggle: (id: string) => void;
  toggleAll: (ids: string[], checked: boolean) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  count: number;
};

const BulkCtx = createContext<Ctx | null>(null);

export function BulkProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) ids.forEach((id) => next.add(id));
      else ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const value = useMemo<Ctx>(
    () => ({
      selected,
      toggle,
      toggleAll,
      clear,
      isSelected: (id) => selected.has(id),
      count: selected.size,
    }),
    [selected, toggle, toggleAll, clear],
  );

  return <BulkCtx.Provider value={value}>{children}</BulkCtx.Provider>;
}

export function useBulk() {
  const ctx = useContext(BulkCtx);
  if (!ctx) throw new Error("useBulk must be used inside BulkProvider");
  return ctx;
}

export function RowCheckbox({ id }: { id: string }) {
  const { isSelected, toggle } = useBulk();
  return (
    <input
      type="checkbox"
      checked={isSelected(id)}
      onChange={() => toggle(id)}
      onClick={(e) => e.stopPropagation()}
      style={{ cursor: "pointer" }}
      aria-label="선택"
    />
  );
}

export function HeaderCheckbox({ ids }: { ids: string[] }) {
  const { selected, toggleAll } = useBulk();
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id));
  const someChecked = ids.some((id) => selected.has(id));
  return (
    <input
      type="checkbox"
      checked={allChecked}
      ref={(el) => {
        if (el) el.indeterminate = !allChecked && someChecked;
      }}
      onChange={(e) => toggleAll(ids, e.target.checked)}
      style={{ cursor: "pointer" }}
      aria-label="전체 선택"
    />
  );
}

export function BulkBar() {
  const router = useRouter();
  const { selected, clear, count } = useBulk();
  const [busy, setBusy] = useState(false);
  if (count === 0) return null;

  async function bulkApprove() {
    if (!confirm(`${count}건을 일괄 승인할까요?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/applications/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), status: "approved" }),
      });
      if (!res.ok) throw new Error(await res.text());
      clear();
      router.refresh();
    } catch {
      alert("일괄 처리 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "10px 14px",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
        {count}건 선택됨
      </span>
      <button
        type="button"
        onClick={bulkApprove}
        disabled={busy}
        style={{
          padding: "6px 14px",
          borderRadius: 6,
          border: "none",
          background: "var(--accent)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 500,
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        일괄 승인
      </button>
      <button
        type="button"
        onClick={clear}
        disabled={busy}
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid var(--border)",
          background: "#fff",
          color: "var(--text-muted)",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        선택 해제
      </button>
    </div>
  );
}
