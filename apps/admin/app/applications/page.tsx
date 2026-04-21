export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { listApplications, listCohorts } from "@neomokdeul/db/store";
import type { Application, Cohort } from "@neomokdeul/db";
import { CountsWidget } from "./CountsWidget";
import { Filters } from "./Filters";
import { BulkProvider, BulkBar } from "./BulkActions";
import { ApplicationRow, RowHeader } from "./ApplicationRow";

type SP = {
  cohort?: string;
  status?: string;
  gender?: string;
  region?: string;
  mbti?: string;
  birthFrom?: string;
  birthTo?: string;
  q?: string;
};

function applyFilters(apps: Application[], sp: SP): Application[] {
  const q = (sp.q ?? "").trim().toLowerCase();
  const birthFrom = sp.birthFrom ? parseInt(sp.birthFrom, 10) : undefined;
  const birthTo = sp.birthTo ? parseInt(sp.birthTo, 10) : undefined;

  return apps.filter((a) => {
    if (sp.status && sp.status !== "all" && a.status !== sp.status) return false;
    if (sp.gender && sp.gender !== "all" && a.gender !== sp.gender) return false;
    if (sp.region && sp.region !== "all" && a.region !== sp.region) return false;
    if (sp.mbti && sp.mbti !== "all" && a.mbti !== sp.mbti) return false;
    if (birthFrom && !Number.isNaN(birthFrom) && a.birthYear < birthFrom) return false;
    if (birthTo && !Number.isNaN(birthTo) && a.birthYear > birthTo) return false;
    if (q) {
      const hay = `${a.name} ${a.phone}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? "var(--text)" : "var(--text-muted)",
    borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
    marginBottom: -1,
    textDecoration: "none",
    display: "inline-block",
    whiteSpace: "nowrap",
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const [allApps, allCohorts] = await Promise.all([
    listApplications(),
    listCohorts(),
  ]);

  // Cohort lookup
  const cohortById = new Map<string, Cohort>();
  const cohortBySlug = new Map<string, Cohort>();
  for (const c of allCohorts) {
    cohortById.set(c.id, c);
    cohortBySlug.set(c.slug, c);
  }

  // Which cohorts to show as tabs: has applications OR recruiting
  const cohortIdsWithApps = new Set(allApps.map((a) => a.cohortId));
  const tabCohorts = allCohorts
    .filter((c) => cohortIdsWithApps.has(c.id) || c.status === "recruiting")
    .sort((a, b) => (a.programStartDate > b.programStartDate ? -1 : 1));

  const activeCohort = sp.cohort ? cohortBySlug.get(sp.cohort) ?? null : null;

  // Scope applications to selected cohort (for counts widget & list)
  const scopedApps = activeCohort
    ? allApps.filter((a) => a.cohortId === activeCohort.id)
    : allApps;

  // Apply filter chain
  let displayApps = applyFilters(scopedApps, sp);

  // Newest first
  displayApps = [...displayApps].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const regions = Array.from(new Set(scopedApps.map((a) => a.region))).filter(Boolean);
  const visibleIds = displayApps.map((a) => a.id);

  // Total counts for breadcrumb summary (unfiltered by filter bar, but scoped to tab)
  const pending = scopedApps.filter((a) => a.status === "pending").length;
  const approved = scopedApps.filter((a) => a.status === "approved").length;
  const rejected = scopedApps.filter((a) => a.status === "rejected").length;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
        홈 / 신청 관리
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "var(--text)",
          margin: 0,
        }}
      >
        신청 관리
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          marginTop: 6,
          marginBottom: 20,
        }}
      >
        대기 {pending} · 승인 {approved} · 반려 {rejected} · 총 {scopedApps.length}
      </p>

      {/* Cohort tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--border)",
          marginBottom: 20,
          overflowX: "auto",
        }}
      >
        <Link href="/applications" style={tabStyle(!sp.cohort)}>
          전체
        </Link>
        {tabCohorts.map((c) => (
          <Link
            key={c.id}
            href={`/applications?cohort=${encodeURIComponent(c.slug)}`}
            style={tabStyle(sp.cohort === c.slug)}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* Count cards */}
      <CountsWidget applications={scopedApps} cohort={activeCohort} />

      {/* Filters */}
      <Filters regions={regions} />

      {/* Bulk + Table */}
      <BulkProvider>
        <BulkBar />

        {displayApps.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 14,
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            <div style={{ marginBottom: 10 }}>
              신청이 없습니다. 기수 모집 상태를 확인하세요.
            </div>
            <Link
              href="/cohorts"
              style={{
                fontSize: 13,
                color: "var(--accent)",
                fontWeight: 500,
                textDecoration: "underline",
              }}
            >
              기수 관리로 이동
            </Link>
          </div>
        ) : (
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <RowHeader ids={visibleIds} />
            {displayApps.map((app) => (
              <ApplicationRow key={app.id} app={app} />
            ))}
          </div>
        )}
      </BulkProvider>
    </div>
  );
}
