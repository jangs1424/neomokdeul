import type { Application, Cohort } from "@neomokdeul/db";

type Props = {
  applications: Application[];
  cohort?: Cohort | null;
};

function Card({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: "warning" | "accent" | "muted";
}) {
  const toneColor =
    tone === "warning"
      ? "var(--warning)"
      : tone === "accent"
        ? "var(--accent)"
        : "var(--text-muted)";
  return (
    <div
      style={{
        flex: "1 1 160px",
        minWidth: 160,
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "var(--surface-2)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: toneColor,
          }}
        >
          {icon}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "var(--text)",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Gauge({
  label,
  filled,
  total,
}: {
  label: string;
  filled: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, (filled / total) * 100) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
        <span style={{ color: "var(--text)", fontWeight: 600 }}>
          {filled} / {total}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: "var(--surface-2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "var(--accent)",
            transition: "width 0.2s ease",
          }}
        />
      </div>
    </div>
  );
}

// Simple inline SVG icons
const IconClock = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const IconMale = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="10" cy="14" r="5" />
    <path d="M15 9l5-5M20 4v5M20 4h-5" />
  </svg>
);
const IconFemale = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="9" r="5" />
    <path d="M12 14v7M9 18h6" />
  </svg>
);
const IconCheck = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

export function CountsWidget({ applications, cohort }: Props) {
  const pendingMale = applications.filter(
    (a) => a.status === "pending" && a.gender === "male",
  ).length;
  const pendingFemale = applications.filter(
    (a) => a.status === "pending" && a.gender === "female",
  ).length;
  const approvedMale = applications.filter(
    (a) => a.status === "approved" && a.gender === "male",
  ).length;
  const approvedFemale = applications.filter(
    (a) => a.status === "approved" && a.gender === "female",
  ).length;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 20,
      }}
    >
      <Card label="남 대기" value={pendingMale} icon={IconMale} tone="warning" />
      <Card label="여 대기" value={pendingFemale} icon={IconFemale} tone="warning" />
      <Card
        label="결제 완료 (남/여)"
        value={
          <span>
            {approvedMale}
            <span style={{ color: "var(--text-muted)", fontSize: 16, fontWeight: 400 }}>
              {" / "}
            </span>
            {approvedFemale}
          </span>
        }
        icon={IconCheck}
        tone="accent"
      />
      {cohort && (
        <div
          style={{
            flex: "2 1 320px",
            minWidth: 300,
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              aria-hidden
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "var(--surface-2)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
              }}
            >
              {IconClock}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
              정원 게이지 · {cohort.name}
            </span>
          </div>
          <Gauge label="남" filled={approvedMale} total={cohort.maxMale} />
          <Gauge label="여" filled={approvedFemale} total={cohort.maxFemale} />
        </div>
      )}
    </div>
  );
}
