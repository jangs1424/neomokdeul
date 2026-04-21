"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CloneButton({ cohortId }: { cohortId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClone() {
    const ok = confirm(
      "이 기수 설정을 복사해 새 기수를 만들까요? 이름·일정은 다시 설정하셔야 해요."
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/cohorts/${cohortId}/clone`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? "복제 실패");
        return;
      }
      router.push(`/cohorts/${json.id}`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClone}
      disabled={loading}
      style={{
        fontSize: 12,
        color: "var(--text-muted)",
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "4px 10px",
        cursor: loading ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
      }}
    >
      {loading ? "복제 중..." : "복제"}
    </button>
  );
}
