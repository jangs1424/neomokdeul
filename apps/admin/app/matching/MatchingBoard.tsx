"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Application, Matching, MatchingStatus } from "@neomokdeul/db";

type Props = {
  cohortId: string;
  matchings: Matching[];
  appsById: Record<string, Application>;
  readyMen: Application[];
  readyWomen: Application[];
};

type View = "cards" | "table";

export function MatchingBoard({
  cohortId: _cohortId,
  matchings,
  appsById,
  readyMen: _readyMen,
  readyWomen,
}: Props) {
  const [view, setView] = useState<View>("cards");
  const [round, setRound] = useState<1 | 2>(1);
  const router = useRouter();

  const scopedMatchings = useMemo(
    () =>
      matchings
        .filter((m) => m.round === round)
        .filter((m) => m.status !== "superseded")
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [matchings, round],
  );

  async function handleSwap(
    matchingId: string,
    withApplicationId: string,
    side: "male" | "female",
  ) {
    const res = await fetch(`/api/matching/${matchingId}/swap`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ withApplicationId, side }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(`교체 실패: ${body.error ?? res.statusText}`);
      return;
    }
    router.refresh();
  }

  async function handlePublishOne(matchingId: string) {
    const res = await fetch(`/api/matching/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ matchingId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(`공개 실패: ${body.error ?? res.statusText}`);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          <RoundTab active={round === 1} onClick={() => setRound(1)}>
            1차
          </RoundTab>
          <RoundTab active={round === 2} onClick={() => setRound(2)}>
            2차
          </RoundTab>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          <ViewTab active={view === "cards"} onClick={() => setView("cards")}>
            카드 2열 뷰
          </ViewTab>
          <ViewTab active={view === "table"} onClick={() => setView("table")}>
            테이블 뷰
          </ViewTab>
        </div>
      </div>

      {scopedMatchings.length === 0 ? (
        <div
          style={{
            padding: "48px 0",
            textAlign: "center",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            background: "var(--surface)",
            fontSize: 13,
          }}
        >
          아직 {round}차 매칭이 없습니다. 위쪽 [매칭 실행] 버튼을 눌러 생성하세요.
        </div>
      ) : view === "cards" ? (
        <CardView
          matchings={scopedMatchings}
          appsById={appsById}
          readyWomen={readyWomen}
          onSwap={handleSwap}
          onPublish={handlePublishOne}
        />
      ) : (
        <TableView
          matchings={scopedMatchings}
          appsById={appsById}
          onPublish={handlePublishOne}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Round/View tabs
// ---------------------------------------------------------------------------
function RoundTab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        border: "none",
        background: active ? "var(--accent)" : "transparent",
        color: active ? "#fff" : "var(--text-muted)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function ViewTab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 12px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        border: "1px solid var(--border)",
        background: active ? "var(--surface-2)" : "#fff",
        color: active ? "var(--text)" : "var(--text-muted)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------
function StatusPill({ status }: { status: MatchingStatus }) {
  const config: Record<MatchingStatus, { label: string; bg: string; color: string }> = {
    draft: { label: "draft", bg: "var(--warning-soft)", color: "#92400e" },
    published: { label: "published", bg: "var(--accent-soft)", color: "#065f46" },
    superseded: { label: "superseded", bg: "var(--surface-2)", color: "var(--text-muted)" },
  };
  const c = config[status];
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      {c.label}
    </span>
  );
}

function RoundPill({ round }: { round: 1 | 2 }) {
  return (
    <span
      style={{
        background: "var(--info-soft)",
        color: "#1e40af",
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {round}차
    </span>
  );
}

// ---------------------------------------------------------------------------
// Card view
// ---------------------------------------------------------------------------
function CardView({
  matchings,
  appsById,
  readyWomen,
  onSwap,
  onPublish,
}: {
  matchings: Matching[];
  appsById: Record<string, Application>;
  readyWomen: Application[];
  onSwap: (id: string, withApplicationId: string, side: "male" | "female") => Promise<void>;
  onPublish: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [swapOpen, setSwapOpen] = useState<string | null>(null);

  function toggle(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  function onDragStart(e: React.DragEvent, fromMatchingId: string, applicationId: string) {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ fromMatchingId, applicationId }),
    );
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function onDrop(e: React.DragEvent, targetMatchingId: string) {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;
      const { fromMatchingId, applicationId } = JSON.parse(raw) as {
        fromMatchingId: string;
        applicationId: string;
      };
      if (fromMatchingId === targetMatchingId) return;
      await onSwap(targetMatchingId, applicationId, "female");
    } catch (err) {
      console.error("[onDrop]", err);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: 12,
      }}
    >
      {matchings.map((m) => {
        const male = appsById[m.maleApplicationId];
        const female = appsById[m.femaleApplicationId];
        const isExp = expanded[m.id];
        const reasoning = m.reasoning ?? "";
        const truncated = reasoning.length > 100 ? reasoning.slice(0, 100) + "…" : reasoning;

        return (
          <div
            key={m.id}
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 14,
            }}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, m.id)}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <RoundPill round={m.round} />
              <StatusPill status={m.status} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginLeft: "auto",
                }}
              >
                score {typeof m.score === "number" ? m.score.toFixed(2) : "—"}
              </span>
            </div>

            {/* Pair row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 20px 1fr",
                gap: 10,
                alignItems: "stretch",
              }}
            >
              <PersonCard app={male} side="male" />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  fontSize: 14,
                }}
              >
                ↔
              </div>
              <div
                draggable
                onDragStart={(e) =>
                  female && onDragStart(e, m.id, female.id)
                }
                style={{ cursor: "grab" }}
              >
                <PersonCard app={female} side="female" />
              </div>
            </div>

            {/* Reasoning */}
            {reasoning && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 10px",
                  background: "var(--surface)",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                {isExp ? reasoning : truncated}
                {reasoning.length > 100 && (
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    style={{
                      marginLeft: 6,
                      background: "transparent",
                      border: "none",
                      color: "var(--accent)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {isExp ? "접기" : "더 보기"}
                  </button>
                )}
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <ActionButton
                onClick={() => setSwapOpen(swapOpen === m.id ? null : m.id)}
              >
                교체
              </ActionButton>
              <ActionButton
                onClick={() =>
                  alert(previewMessage(m, male, female))
                }
              >
                미리보기 공개 메시지
              </ActionButton>
              {m.status === "draft" && (
                <ActionButton onClick={() => onPublish(m.id)} primary>
                  개별 공개
                </ActionButton>
              )}
            </div>

            {/* Swap modal */}
            {swapOpen === m.id && (
              <SwapPanel
                currentFemaleId={m.femaleApplicationId}
                candidates={readyWomen}
                onSelect={async (appId) => {
                  setSwapOpen(null);
                  await onSwap(m.id, appId, "female");
                }}
                onClose={() => setSwapOpen(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 11px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        border: primary ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: primary ? "var(--accent)" : "#fff",
        color: primary ? "#fff" : "var(--text)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function PersonCard({
  app,
  side,
}: {
  app: Application | undefined;
  side: "male" | "female";
}) {
  if (!app) {
    return (
      <div
        style={{
          padding: 10,
          background: "var(--surface)",
          borderRadius: 6,
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        (삭제됨)
      </div>
    );
  }
  const accentBg = side === "male" ? "var(--info-soft)" : "#fdf2f8";
  const accentColor = side === "male" ? "#1e40af" : "#9f1239";
  return (
    <div
      style={{
        padding: 10,
        background: "var(--surface)",
        borderRadius: 6,
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span
          style={{
            background: accentBg,
            color: accentColor,
            padding: "1px 6px",
            borderRadius: 8,
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {side === "male" ? "남" : "여"}
        </span>
        <span style={{ fontWeight: 600, color: "var(--text)" }}>{app.name}</span>
        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{app.birthYear}</span>
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
        {app.mbti ?? "—"} · {app.region} · {app.occupation}
      </div>
    </div>
  );
}

function SwapPanel({
  currentFemaleId,
  candidates,
  onSelect,
  onClose,
}: {
  currentFemaleId: string;
  candidates: Application[];
  onSelect: (appId: string) => void;
  onClose: () => void;
}) {
  const list = candidates.filter((c) => c.id !== currentFemaleId);
  return (
    <div
      style={{
        marginTop: 10,
        padding: 10,
        background: "var(--surface-2)",
        borderRadius: 6,
        border: "1px dashed var(--border-strong)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
          교체할 여성 선택
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            fontSize: 14,
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          maxHeight: 200,
          overflowY: "auto",
        }}
      >
        {list.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            교체 후보가 없습니다.
          </div>
        )}
        {list.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            style={{
              textAlign: "left",
              padding: "6px 8px",
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: 4,
              fontSize: 12,
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            <strong>{c.name}</strong>{" "}
            <span style={{ color: "var(--text-muted)" }}>
              · {c.birthYear} · {c.mbti ?? "—"} · {c.region}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table view
// ---------------------------------------------------------------------------
function TableView({
  matchings,
  appsById,
  onPublish,
}: {
  matchings: Matching[];
  appsById: Record<string, Application>;
  onPublish: (id: string) => Promise<void>;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "56px 1.3fr 1.3fr 80px 100px 140px",
          padding: "10px 12px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          gap: 8,
        }}
      >
        <span>회차</span>
        <span>남성</span>
        <span>여성</span>
        <span>점수</span>
        <span>상태</span>
        <span>액션</span>
      </div>
      {matchings.map((m) => {
        const male = appsById[m.maleApplicationId];
        const female = appsById[m.femaleApplicationId];
        return (
          <div
            key={m.id}
            style={{
              display: "grid",
              gridTemplateColumns: "56px 1.3fr 1.3fr 80px 100px 140px",
              padding: "10px 12px",
              borderBottom: "1px solid var(--border)",
              fontSize: 13,
              color: "var(--text)",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{m.round}차</span>
            <span>
              {male ? `${male.name} (${male.birthYear})` : "(삭제됨)"}
            </span>
            <span>
              {female ? `${female.name} (${female.birthYear})` : "(삭제됨)"}
            </span>
            <span style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
              {typeof m.score === "number" ? m.score.toFixed(2) : "—"}
            </span>
            <span>
              <StatusPill status={m.status} />
            </span>
            <span>
              {m.status === "draft" ? (
                <button
                  type="button"
                  onClick={() => onPublish(m.id)}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    border: "1px solid var(--accent)",
                    background: "var(--accent)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  공개
                </button>
              ) : (
                <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function previewMessage(
  m: Matching,
  male: Application | undefined,
  female: Application | undefined,
): string {
  return [
    `[너목들] ${m.round}차 매칭 결과`,
    `남성: ${male?.name ?? "?"} (${male?.birthYear ?? "?"}, ${male?.mbti ?? "?"})`,
    `여성: ${female?.name ?? "?"} (${female?.birthYear ?? "?"}, ${female?.mbti ?? "?"})`,
    `점수: ${typeof m.score === "number" ? m.score.toFixed(2) : "—"}`,
    ``,
    `* 실제 SMS는 공개 확정 후 별도 발송됩니다.`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// PublishAllClient (inline island used by /matching page)
// ---------------------------------------------------------------------------
export function PublishAllClient({ cohortId }: { cohortId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!confirm("모든 draft 매칭을 공개합니다. 진행할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/matching/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cohortId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(`공개 실패: ${body.error ?? res.statusText}`);
        return;
      }
      const data = await res.json();
      alert(`${data.updated}건 공개되었습니다.`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
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
      {busy ? "공개 중…" : "전체 공개"}
    </button>
  );
}
