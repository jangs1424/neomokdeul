"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Application, MatchResponse } from "@neomokdeul/db";

/**
 * Surface how many approved applicants have submitted the match form,
 * and let the operator fire reminder SMS to the laggards.
 *
 * NOTE: pure client component — server passes plain arrays so rendering stays cheap.
 */
export function MatchFormTracker({
  cohortId,
  approvedApps,
  responses,
}: {
  cohortId: string;
  approvedApps: Application[];
  responses: MatchResponse[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const { submittedIds, missingMen, missingWomen, submittedMen, submittedWomen } =
    useMemo(() => {
      const sub = new Set(responses.map((r) => r.applicationId));
      const missingMen: Application[] = [];
      const missingWomen: Application[] = [];
      let submittedMen = 0;
      let submittedWomen = 0;
      for (const a of approvedApps) {
        const has = sub.has(a.id);
        if (a.gender === "male") {
          if (has) submittedMen++;
          else missingMen.push(a);
        } else {
          if (has) submittedWomen++;
          else missingWomen.push(a);
        }
      }
      return {
        submittedIds: sub,
        missingMen,
        missingWomen,
        submittedMen,
        submittedWomen,
      };
    }, [approvedApps, responses]);

  const totalMen = approvedApps.filter((a) => a.gender === "male").length;
  const totalWomen = approvedApps.filter((a) => a.gender === "female").length;
  const totalSubmitted = submittedIds.size;
  const totalApproved = approvedApps.length;
  const allMissing = [...missingMen, ...missingWomen];

  async function sendReminders() {
    if (allMissing.length === 0) {
      alert("리마인드 대상이 없습니다.");
      return;
    }
    if (!confirm(`${allMissing.length}명에게 리마인드 SMS를 보낼까요?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/matching/remind", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cohortId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`리마인드 실패: ${data.error ?? res.statusText}`);
        return;
      }
      alert(
        `리마인드 완료\n성공 ${data.sent ?? 0}건 · 실패 ${data.failed ?? 0}건`,
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const pct =
    totalApproved > 0 ? Math.round((totalSubmitted / totalApproved) * 100) : 0;
  const tone =
    totalApproved === 0
      ? "muted"
      : pct >= 80
        ? "ok"
        : pct >= 50
          ? "warn"
          : "bad";
  const toneBg =
    tone === "ok"
      ? "var(--accent-soft)"
      : tone === "warn"
        ? "var(--warning-soft)"
        : tone === "bad"
          ? "#fee2e2"
          : "var(--surface-2)";
  const toneColor =
    tone === "ok"
      ? "#065f46"
      : tone === "warn"
        ? "#92400e"
        : tone === "bad"
          ? "#991b1b"
          : "var(--text-muted)";

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        background: "#fff",
        marginBottom: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          background: toneBg,
          color: toneColor,
          flexWrap: "wrap",
        }}
      >
        <strong style={{ fontSize: 13 }}>
          매칭 폼: 남 {submittedMen}/{totalMen} · 여 {submittedWomen}/{totalWomen} · 총{" "}
          {totalSubmitted}/{totalApproved} 제출 ({pct}%)
        </strong>
        <div style={{ flex: 1 }} />
        {allMissing.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "#fff",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              {expanded ? "접기" : `미제출자 ${allMissing.length}명 보기`}
            </button>
            <button
              type="button"
              onClick={sendReminders}
              disabled={busy}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "1px solid var(--accent)",
                background: busy ? "var(--accent-soft)" : "var(--accent)",
                color: busy ? "#065f46" : "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: busy ? "wait" : "pointer",
              }}
            >
              {busy ? "발송 중…" : "리마인드 SMS 발송"}
            </button>
          </>
        )}
      </div>

      {expanded && allMissing.length > 0 && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--text)",
          }}
        >
          {missingMen.length > 0 && (
            <MissingRow label="남성 미제출" apps={missingMen} />
          )}
          {missingWomen.length > 0 && (
            <MissingRow label="여성 미제출" apps={missingWomen} />
          )}
        </div>
      )}
    </div>
  );
}

function MissingRow({ label, apps }: { label: string; apps: Application[] }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 6,
        }}
      >
        {label} ({apps.length})
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {apps.map((a) => (
          <span
            key={a.id}
            style={{
              padding: "3px 8px",
              borderRadius: 10,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
          >
            {a.name} · {a.phone}
          </span>
        ))}
      </div>
    </div>
  );
}
