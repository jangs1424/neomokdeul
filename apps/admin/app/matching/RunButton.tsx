"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RunButton({
  cohortId,
  menCount,
  womenCount,
  responseCount,
  totalApproved,
}: {
  cohortId: string;
  menCount: number;
  womenCount: number;
  responseCount: number;
  totalApproved: number;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState<"1" | "2" | "both">("1");
  const router = useRouter();
  const imbalance = Math.abs(menCount - womenCount);
  const excessSide = menCount > womenCount ? "남성" : "여성";
  const lowResponse =
    totalApproved > 0 && responseCount < totalApproved;
  const responseRatio =
    totalApproved > 0 ? responseCount / totalApproved : 0;
  const severeLowResponse = totalApproved > 0 && responseRatio < 0.5;

  async function run() {
    setBusy(true);
    try {
      const res = await fetch(`/api/matching/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          cohortId,
          round: round === "both" ? "both" : Number(round),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(`매칭 실행 실패: ${body.error ?? res.statusText}`);
        return;
      }
      const data = await res.json();
      const modeLabel =
        data.llmMode === "claude"
          ? "Claude LLM"
          : data.llmMode === "heuristic"
            ? "휴리스틱 (LLM 미연동)"
            : "—";
      alert(
        [
          `매칭 생성 완료`,
          `1차: ${data.round1 ?? 0}쌍, 2차: ${data.round2 ?? 0}쌍`,
          `풀 크기: ${data.poolSize ?? 0}명`,
          `슬롯 부족 스킵: ${data.skippedLowOverlap ?? 0}건`,
          `스코어링: ${modeLabel}`,
        ].join("\n"),
      );
      setOpen(false);
      router.refresh();
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
          padding: "7px 14px",
          borderRadius: 6,
          border: "1px solid var(--accent)",
          background: "var(--accent)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        매칭 실행
      </button>

      {open && (
        <div
          onClick={() => !busy && setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,24,39,0.4)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: 20,
              maxWidth: 440,
              width: "90%",
              border: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
                marginBottom: 8,
                color: "var(--text)",
              }}
            >
              매칭 실행 확인
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 12,
                lineHeight: 1.6,
              }}
            >
              선택한 회차의 기존 draft 매칭은 삭제되고 새로 생성됩니다. Published 매칭은 유지됩니다.
            </p>

            <div
              style={{
                padding: "10px 12px",
                marginBottom: 10,
                borderRadius: 6,
                background: "var(--surface-2)",
                fontSize: 12,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span>매칭 가능 인원:</span>
              <strong>남 {menCount}</strong>
              <span style={{ color: "var(--text-muted)" }}>·</span>
              <strong>여 {womenCount}</strong>
              {imbalance > 0 && (
                <span style={{ color: "#92400e", fontWeight: 600, marginLeft: 6 }}>
                  → {excessSide} {imbalance}명 미성사 예정
                </span>
              )}
            </div>

            {lowResponse && (
              <div
                style={{
                  padding: "10px 12px",
                  marginBottom: 16,
                  borderRadius: 6,
                  background: severeLowResponse ? "#fee2e2" : "var(--warning-soft)",
                  border: `1px solid ${severeLowResponse ? "#fca5a5" : "#f59e0b"}`,
                  fontSize: 12,
                  color: severeLowResponse ? "#991b1b" : "#92400e",
                  lineHeight: 1.5,
                }}
              >
                <strong>
                  {responseCount}/{totalApproved}명만 매칭 폼 제출
                </strong>{" "}
                — 나머지는 매칭 제외됩니다. 계속할까요?
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                회차
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {(["1", "2", "both"] as const).map((r) => (
                  <label
                    key={r}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      border: `1px solid ${round === r ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 6,
                      fontSize: 13,
                      textAlign: "center",
                      cursor: "pointer",
                      background: round === r ? "var(--accent-soft)" : "#fff",
                      color: round === r ? "#065f46" : "var(--text)",
                      fontWeight: round === r ? 600 : 400,
                    }}
                  >
                    <input
                      type="radio"
                      name="round"
                      value={r}
                      checked={round === r}
                      onChange={() => setRound(r)}
                      style={{ display: "none" }}
                    />
                    {r === "both" ? "1·2차 모두" : `${r}차`}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                style={{
                  padding: "7px 14px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "#fff",
                  color: "var(--text)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={run}
                disabled={busy}
                style={{
                  padding: "7px 14px",
                  borderRadius: 6,
                  border: "1px solid var(--accent)",
                  background: busy ? "var(--accent-soft)" : "var(--accent)",
                  color: busy ? "#065f46" : "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                {busy ? "실행 중…" : "실행"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
