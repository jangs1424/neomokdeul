export const dynamic = "force-dynamic";
export const revalidate = 0;

import {
  listCohorts,
  listApplications,
  updateCohort,
  type Cohort,
  type CohortStatus,
} from "@neomokdeul/db";
import CloneButton from "./CloneButton";

// ---------------------------------------------------------------------------
// Auto status transitions — idempotent
// ---------------------------------------------------------------------------
async function syncCohortStatuses(cohorts: Cohort[]): Promise<void> {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  for (const c of cohorts) {
    let next: CohortStatus | null = null;

    if (c.status === "recruiting" && new Date(c.applyClosesAt) < now) {
      next = "closed";
    } else if (c.status === "closed" && c.programStartDate <= todayStr) {
      next = "running";
    } else if (c.status === "running" && c.programEndDate < todayStr) {
      next = "completed";
    }

    if (next) {
      console.log(
        `[syncCohortStatuses] ${c.name} (${c.id}): ${c.status} → ${next}`
      );
      await updateCohort(c.id, { status: next });
    }
  }
}

// ---------------------------------------------------------------------------
// Status display helpers
// ---------------------------------------------------------------------------
const STATUS_LABEL: Record<CohortStatus, string> = {
  draft: "초안",
  recruiting: "모집중",
  closed: "마감",
  running: "진행중",
  completed: "완료",
};

const STATUS_STYLE: Record<CohortStatus, React.CSSProperties> = {
  draft: { background: "var(--surface-2)", color: "#374151" },
  recruiting: { background: "var(--accent-soft)", color: "#065f46" },
  closed: { background: "var(--warning-soft)", color: "#92400e" },
  running: { background: "var(--info-soft)", color: "#1e40af" },
  completed: { background: "var(--surface-2)", color: "var(--text-muted)" },
};

function StatusBadge({ status }: { status: CohortStatus }) {
  return (
    <span
      style={{
        ...STATUS_STYLE[status],
        padding: "3px 9px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------
function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fmtPrice(n: number): string {
  return "₩" + n.toLocaleString("ko-KR");
}

// ---------------------------------------------------------------------------
// Cohort card
// ---------------------------------------------------------------------------
function CohortCard({
  cohort,
  totalApps,
  maleApps,
  femaleApps,
  approvedTotal,
  approvedMale,
  approvedFemale,
  paidCount,
}: {
  cohort: Cohort;
  totalApps: number;
  maleApps: number;
  femaleApps: number;
  approvedTotal: number;
  approvedMale: number;
  approvedFemale: number;
  paidCount: number;
}) {
  const cap = cohort.maxMale + cohort.maxFemale;
  const filled = Math.min(totalApps, cap);
  const fillPct = cap > 0 ? Math.round((filled / cap) * 100) : 0;

  return (
    <div className="cohort-card">
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <StatusBadge status={cohort.status} />
          <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text)" }}>
            {cohort.name}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "monospace",
              background: "var(--surface)",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            {cohort.slug}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <CloneButton cohortId={cohort.id} />
          <a
            href={`/cohorts/${cohort.id}`}
            style={{
              fontSize: 12,
              color: "var(--accent)",
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid var(--accent)",
              borderRadius: 6,
              padding: "4px 10px",
              whiteSpace: "nowrap",
            }}
          >
            편집 →
          </a>
        </div>
      </div>

      {/* Date + price row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 20px",
          marginBottom: 14,
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        <span>
          <strong style={{ color: "var(--text)" }}>모집</strong>{" "}
          {fmtDate(cohort.applyOpensAt)} ~ {fmtDate(cohort.applyClosesAt)}
        </span>
        <span>
          <strong style={{ color: "var(--text)" }}>프로그램</strong>{" "}
          {fmtDate(cohort.programStartDate)} ~ {fmtDate(cohort.programEndDate)}
        </span>
        <span>
          <strong style={{ color: "var(--text)" }}>참가비</strong>{" "}
          {fmtPrice(cohort.priceKrw)}
        </span>
        <span>
          <strong style={{ color: "var(--text)" }}>정원</strong> 남 {cohort.maxMale} / 여{" "}
          {cohort.maxFemale}
        </span>
      </div>

      {/* Stats chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <StatChip
          label="신청"
          value={`${totalApps} (남 ${maleApps} / 여 ${femaleApps})`}
          color="var(--text)"
        />
        <StatChip
          label="승인"
          value={`${approvedTotal} (남 ${approvedMale} / 여 ${approvedFemale})`}
          color="#065f46"
          bg="var(--accent-soft)"
        />
        <StatChip
          label="결제완료"
          value={String(paidCount)}
          color="#1e40af"
          bg="var(--info-soft)"
        />

        {/* Fill rate */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "4px 10px",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
            충족률
          </span>
          <div
            style={{
              width: 60,
              height: 6,
              background: "var(--border)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${fillPct}%`,
                height: "100%",
                background: fillPct >= 80 ? "var(--accent)" : fillPct >= 50 ? "#f59e0b" : "#94a3b8",
                borderRadius: 3,
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>
            {fillPct}%
          </span>
        </div>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  color = "var(--text)",
  bg = "var(--surface)",
}: {
  label: string;
  value: string;
  color?: string;
  bg?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: bg,
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "4px 10px",
      }}
    >
      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function CohortsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const activeTab: "active" | "completed" =
    view === "completed" ? "completed" : "active";

  // Fetch data
  const [allCohorts, allApps] = await Promise.all([
    listCohorts(),
    listApplications(),
  ]);

  // Auto-transition statuses (idempotent)
  await syncCohortStatuses(allCohorts);

  // Re-fetch after transitions so displayed data is fresh
  const cohorts = await listCohorts();

  // Split by tab
  const activeCohorts = cohorts.filter((c) =>
    ["draft", "recruiting", "closed", "running"].includes(c.status)
  );
  const completedCohorts = cohorts.filter((c) => c.status === "completed");
  const displayCohorts = activeTab === "active" ? activeCohorts : completedCohorts;

  // Compute per-cohort app stats
  function statsFor(cohortId: string) {
    const apps = allApps.filter((a) => a.cohortId === cohortId);
    const male = apps.filter((a) => a.gender === "male");
    const female = apps.filter((a) => a.gender === "female");
    const approved = apps.filter((a) => a.status === "approved");
    const approvedMale = approved.filter((a) => a.gender === "male");
    const approvedFemale = approved.filter((a) => a.gender === "female");
    // payment_completed_at is not exposed in Application type — always 0 for now
    return {
      totalApps: apps.length,
      maleApps: male.length,
      femaleApps: female.length,
      approvedTotal: approved.length,
      approvedMale: approvedMale.length,
      approvedFemale: approvedFemale.length,
      paidCount: 0,
    };
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    color: active ? "var(--text)" : "var(--text-muted)",
    textDecoration: "none",
    borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
    display: "inline-block",
    transition: "color 0.15s",
  });

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
        <a href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          홈
        </a>
        {" / "}
        기수 관리
      </div>

      {/* Title row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "var(--text)",
            margin: 0,
          }}
        >
          기수 관리
        </h1>
        <a
          href="/cohorts/new"
          style={{
            display: "inline-block",
            padding: "8px 16px",
            borderRadius: 6,
            background: "var(--accent)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            whiteSpace: "nowrap",
            marginTop: 4,
          }}
        >
          + 새 기수
        </a>
      </div>

      <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
        전체 {cohorts.length} · 활성 {activeCohorts.length} · 완료 {completedCohorts.length}
      </p>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          marginTop: 16,
          marginBottom: 20,
        }}
      >
        <a href="/cohorts?view=active" style={tabStyle(activeTab === "active")}>
          활성 기수{" "}
          <span
            style={{
              fontSize: 11,
              background: activeTab === "active" ? "var(--accent-soft)" : "var(--surface-2)",
              color: activeTab === "active" ? "#065f46" : "var(--text-muted)",
              padding: "1px 6px",
              borderRadius: 10,
              fontWeight: 600,
              marginLeft: 4,
            }}
          >
            {activeCohorts.length}
          </span>
        </a>
        <a href="/cohorts?view=completed" style={tabStyle(activeTab === "completed")}>
          완료{" "}
          <span
            style={{
              fontSize: 11,
              background: activeTab === "completed" ? "var(--accent-soft)" : "var(--surface-2)",
              color: activeTab === "completed" ? "#065f46" : "var(--text-muted)",
              padding: "1px 6px",
              borderRadius: 10,
              fontWeight: 600,
              marginLeft: 4,
            }}
          >
            {completedCohorts.length}
          </span>
        </a>
      </div>

      {/* Cohort list */}
      {displayCohorts.length === 0 ? (
        <div
          style={{
            padding: "48px 0",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 14,
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        >
          {activeTab === "active"
            ? "활성 기수가 없습니다. 새 기수를 만들어보세요."
            : "완료된 기수가 없습니다."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {displayCohorts.map((cohort) => {
            const s = statsFor(cohort.id);
            return (
              <CohortCard
                key={cohort.id}
                cohort={cohort}
                {...s}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
