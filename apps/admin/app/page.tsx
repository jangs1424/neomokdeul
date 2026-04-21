export const dynamic = "force-dynamic";

import { listApplications, listCohorts, getSupabaseAdmin } from "@neomokdeul/db";
import {
  StatCard,
  UpcomingCohorts,
  RecentApplications,
  IconAlert,
  IconCheck,
  IconCalendar,
  IconPlay,
} from "./DashboardCards";
import type { RecentApp } from "./DashboardCards";

export default async function Dashboard() {
  // Fetch all data in parallel
  const [apps, cohorts, approvedAwaitingResult] = await Promise.all([
    listApplications(),
    listCohorts(),
    // Count approved apps where payment_link_sent_at IS NULL
    getSupabaseAdmin()
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .is("payment_link_sent_at", null),
  ]);

  // Stat counts
  const pendingCount = apps.filter((a) => a.status === "pending").length;
  const approvedAwaitingSms = approvedAwaitingResult.count ?? 0;
  const recruitingCohorts = cohorts.filter((c) => c.status === "recruiting").length;
  const runningCohorts = cohorts.filter((c) => c.status === "running").length;

  // Upcoming cohorts: apply_closes_at or program_start_date within next 14 days
  const now = Date.now();
  const in14 = now + 14 * 24 * 60 * 60 * 1000;
  const upcomingCohorts = cohorts
    .filter((c) => {
      const startMs = new Date(c.programStartDate).getTime();
      const closeMs = new Date(c.applyClosesAt).getTime();
      return startMs <= in14 || closeMs <= in14;
    })
    .sort(
      (a, b) =>
        new Date(a.programStartDate).getTime() - new Date(b.programStartDate).getTime(),
    )
    .slice(0, 3);

  // Build a cohort map for lookup
  const cohortMap = new Map(cohorts.map((c) => [c.id, c]));

  // Recent 5 applications
  const recentApps: RecentApp[] = apps
    .slice() // already sorted desc by createdAt from the store
    .slice(0, 5)
    .map((a) => {
      const cohort = cohortMap.get(a.cohortId);
      return {
        ...a,
        cohortName: cohort?.name,
        cohortSlug: cohort?.slug,
      };
    });

  return (
    <>
      {/* Hover styles injected as a server-safe style tag */}
      <style>{`
        .dash-stat-card:hover { border-color: var(--border-strong) !important; }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>대시보드</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
          오늘 처리할 것 요약
        </p>
      </div>

      {/* Row 1: Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="대기 중 신청"
          value={pendingCount}
          href="/applications?status=pending"
          icon={<IconAlert />}
          highlight="warning"
        />
        <StatCard
          label="승인 → 발송 대기"
          value={approvedAwaitingSms}
          href="/messages"
          icon={<IconCheck />}
          highlight="accent"
        />
        <StatCard
          label="모집 중인 기수"
          value={recruitingCohorts}
          href="/cohorts?view=active"
          icon={<IconCalendar />}
        />
        <StatCard
          label="진행 중인 기수"
          value={runningCohorts}
          href="/cohorts?view=active"
          icon={<IconPlay />}
        />
      </div>

      {/* Row 2: Panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        <UpcomingCohorts cohorts={upcomingCohorts} />
        <RecentApplications apps={recentApps} />
      </div>
    </>
  );
}
