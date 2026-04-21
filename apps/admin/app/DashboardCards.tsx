import type { Cohort, Application } from "@neomokdeul/db";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

const DAYS_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function formatStartDate(iso: string): string {
  const d = new Date(iso);
  const dow = DAYS_KO[d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${dow})`;
}

export function dCounter(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function isDCounterUrgent(dc: string): boolean {
  if (dc === "D-Day") return true;
  const m = dc.match(/^D-(\d+)$/);
  if (!m) return false;
  return parseInt(m[1], 10) <= 3;
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
type StatCardProps = {
  label: string;
  value: number;
  href: string;
  icon: React.ReactNode;
  highlight?: "warning" | "accent" | "none";
};

export function StatCard({ label, value, href, icon, highlight = "none" }: StatCardProps) {
  const bg =
    highlight === "warning" && value > 0
      ? "var(--warning-soft)"
      : highlight === "accent" && value > 0
        ? "var(--accent-soft)"
        : "#fff";

  const numberColor =
    highlight === "warning" && value > 0
      ? "var(--warning)"
      : highlight === "accent" && value > 0
        ? "var(--accent)"
        : "var(--text)";

  return (
    <a
      href={href}
      className="dash-stat-card"
      style={{
        display: "block",
        padding: 20,
        background: bg,
        border: "1px solid var(--border)",
        borderRadius: 8,
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ color: "var(--text-muted)", display: "flex" }}>{icon}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: numberColor }}>{value}</div>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Panel wrapper
// ---------------------------------------------------------------------------
export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 16,
          color: "var(--text)",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upcoming Cohorts Panel
// ---------------------------------------------------------------------------
export function UpcomingCohorts({ cohorts }: { cohorts: Cohort[] }) {
  if (cohorts.length === 0) {
    return (
      <Panel title="곧 시작하는 기수">
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          곧 시작 예정인 기수가 없어요.
        </p>
      </Panel>
    );
  }
  return (
    <Panel title="곧 시작하는 기수">
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {cohorts.map((c, i) => {
          const dc = dCounter(c.programStartDate);
          const urgent = isDCounterUrgent(dc);
          return (
            <li
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--border)",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {formatStartDate(c.programStartDate)}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 100,
                  background: urgent ? "var(--warning-soft)" : "var(--surface-2)",
                  color: urgent ? "var(--warning)" : "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {dc}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Recent Applications Panel
// ---------------------------------------------------------------------------
export type RecentApp = Application & { cohortName?: string; cohortSlug?: string };

const GENDER_LABEL: Record<string, string> = { male: "남", female: "여" };

export function RecentApplications({ apps }: { apps: RecentApp[] }) {
  if (apps.length === 0) {
    return (
      <Panel title="최근 신청 5건">
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          아직 신청이 없어요.
        </p>
      </Panel>
    );
  }
  return (
    <Panel title="최근 신청 5건">
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {apps.map((a, i) => (
          <li key={a.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
            <a
              href={`/applications?cohort=${a.cohortSlug ?? a.cohortId}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
                    {a.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {GENDER_LABEL[a.gender] ?? a.gender}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-soft)" }}>{a.region}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {a.cohortName ?? a.cohortId}
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-soft)",
                  whiteSpace: "nowrap",
                  marginLeft: 12,
                }}
              >
                {relativeTime(a.createdAt)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icons (16px, server-safe)
// ---------------------------------------------------------------------------
export function IconAlert() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx={8} cy={8} r={7} stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M8 5v3.5M8 10.5v.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCheck() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx={8} cy={8} r={7} stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M5 8l2 2 4-4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCalendar() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x={2} y={3} width={12} height={11} rx={1.5} stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M2 7h12M5 1v4M11 1v4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconPlay() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx={8} cy={8} r={7} stroke="currentColor" strokeWidth={1.5} />
      <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor" />
    </svg>
  );
}
