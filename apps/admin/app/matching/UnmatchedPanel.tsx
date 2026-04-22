import type { Application } from "@neomokdeul/db";

function PersonChip({ app, tone }: { app: Application; tone: "male" | "female" }) {
  const bg = tone === "male" ? "var(--info-soft)" : "var(--danger-soft)";
  const color = tone === "male" ? "#1e40af" : "#991b1b";
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: 2,
        padding: "8px 12px",
        background: bg,
        color,
        borderRadius: 8,
        fontSize: 12,
        minWidth: 140,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13 }}>{app.name}</div>
      <div style={{ fontSize: 11, opacity: 0.85 }}>
        {app.birthYear}년생 · {app.region}
        {app.mbti ? ` · ${app.mbti}` : ""}
      </div>
    </div>
  );
}

export function UnmatchedPanel({
  r1Men,
  r1Women,
  r2Men,
  r2Women,
  hasMatchings,
}: {
  r1Men: Application[];
  r1Women: Application[];
  r2Men: Application[];
  r2Women: Application[];
  hasMatchings: boolean;
}) {
  const total =
    r1Men.length + r1Women.length + r2Men.length + r2Women.length;
  if (total === 0) return null;

  return (
    <section
      style={{
        marginBottom: 24,
        padding: "16px 20px",
        background: "#fff",
        border: "1px solid var(--warning-soft)",
        borderLeft: "4px solid var(--warning)",
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "var(--text)" }}>
          매칭 미성사 {total}명
        </h3>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.6 }}>
        {hasMatchings
          ? "매칭을 돌렸지만 성비 차이 또는 exclusion 규칙으로 짝이 없는 분들입니다. 다음 기수 이월 / 환불 / 수동 처리가 필요합니다."
          : "아직 매칭을 돌리지 않았습니다. 지금 실행하면 아래 인원은 매칭 안 될 예정입니다."}
      </p>

      {(r1Men.length > 0 || r1Women.length > 0) && (
        <RoundSection
          label="1차 매칭 미성사"
          men={r1Men}
          women={r1Women}
        />
      )}

      {(r2Men.length > 0 || r2Women.length > 0) && (
        <RoundSection
          label="2차 매칭 미성사"
          men={r2Men}
          women={r2Women}
        />
      )}
    </section>
  );
}

function RoundSection({
  label,
  men,
  women,
}: {
  label: string;
  men: Application[];
  women: Application[];
}) {
  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {men.map((a) => (
          <PersonChip key={a.id} app={a} tone="male" />
        ))}
        {women.map((a) => (
          <PersonChip key={a.id} app={a} tone="female" />
        ))}
      </div>
    </div>
  );
}
