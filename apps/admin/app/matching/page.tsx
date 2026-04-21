export const dynamic = "force-dynamic";
export const revalidate = 0;

import {
  listApplications,
  listCohorts,
  listMatchings,
  type Application,
  type Cohort,
  type Matching,
} from "@neomokdeul/db";
import { MatchingBoard, PublishAllClient } from "./MatchingBoard";
import { RunButton } from "./RunButton";
import { ExportCsv } from "./ExportCsv";

export default async function MatchingPage({
  searchParams,
}: {
  searchParams: Promise<{ cohortId?: string }>;
}) {
  const { cohortId: cohortIdParam } = await searchParams;

  const [cohorts, allApps] = await Promise.all([
    listCohorts(),
    listApplications(),
  ]);

  // Default: first recruiting/running cohort, else first cohort
  const defaultCohort =
    cohorts.find((c) => c.status === "recruiting" || c.status === "running") ??
    cohorts[0];

  const selectedCohortId = cohortIdParam ?? defaultCohort?.id ?? "";
  const selectedCohort: Cohort | undefined = cohorts.find(
    (c) => c.id === selectedCohortId,
  );

  const matchings: Matching[] = selectedCohort
    ? await listMatchings(selectedCohort.id)
    : [];

  // Cohort-scoped apps
  const cohortApps = selectedCohort
    ? allApps.filter((a) => a.cohortId === selectedCohort.id)
    : [];

  // MVP: ready = approved (payment gate not wired yet)
  const readyMen = cohortApps.filter(
    (a) => a.gender === "male" && a.status === "approved",
  );
  const readyWomen = cohortApps.filter(
    (a) => a.gender === "female" && a.status === "approved",
  );

  const r1Draft = matchings.filter((m) => m.round === 1 && m.status === "draft");
  const r1Pub = matchings.filter((m) => m.round === 1 && m.status === "published");
  const r2Draft = matchings.filter((m) => m.round === 2 && m.status === "draft");
  const r2Pub = matchings.filter((m) => m.round === 2 && m.status === "published");

  // Look-up maps for board rendering
  const appsById: Record<string, Application> = {};
  for (const a of cohortApps) appsById[a.id] = a;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
        <a href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          홈
        </a>
        {" / "}
        매칭 실행
      </div>

      {/* Title + subtitle */}
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: "var(--text)" }}>
        매칭 실행
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          marginTop: 6,
          marginBottom: 20,
        }}
      >
        기수별 1차·2차 매칭을 실행하고 공개합니다. 제외 규칙과 이전 기수 쌍을 반영해 자동 페어링한 뒤,
        수동 교체·드래그로 조정하세요.
      </p>

      {/* Top bar: cohort dropdown + actions */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <form
          method="get"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <label
            htmlFor="cohortId"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            기수
          </label>
          <select
            id="cohortId"
            name="cohortId"
            defaultValue={selectedCohortId}
            style={{
              padding: "7px 10px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "#fff",
              fontSize: 13,
              color: "var(--text)",
              minWidth: 220,
            }}
          >
            {cohorts.length === 0 && <option value="">기수 없음</option>}
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.status})
              </option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              padding: "7px 12px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            전환
          </button>
        </form>

        {selectedCohort && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <RunButton cohortId={selectedCohort.id} />
            <ExportCsv
              cohortSlug={selectedCohort.slug}
              matchings={matchings}
              appsById={appsById}
            />
            <PublishAllClient cohortId={selectedCohort.id} />
          </div>
        )}
      </div>

      {!selectedCohort ? (
        <div
          style={{
            padding: "48px 0",
            textAlign: "center",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        >
          기수를 먼저 생성해 주세요.
        </div>
      ) : (
        <>
          {/* Status cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginBottom: 24,
            }}
          >
            <StatCard label="승인 남성 (매칭 가능)" value={String(readyMen.length)} tone="info" />
            <StatCard
              label="승인 여성 (매칭 가능)"
              value={String(readyWomen.length)}
              tone="info"
            />
            <StatCard
              label="1차 매칭"
              value={`draft ${r1Draft.length} · published ${r1Pub.length}`}
              tone="warning"
            />
            <StatCard
              label="2차 매칭"
              value={`draft ${r2Draft.length} · published ${r2Pub.length}`}
              tone="warning"
            />
          </div>

          {/* Board */}
          <MatchingBoard
            cohortId={selectedCohort.id}
            matchings={matchings}
            appsById={appsById}
            readyMen={readyMen}
            readyWomen={readyWomen}
          />
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "info" | "warning" | "accent";
}) {
  const bg =
    tone === "info"
      ? "var(--info-soft)"
      : tone === "warning"
        ? "var(--warning-soft)"
        : "var(--accent-soft)";
  const color =
    tone === "info" ? "#1e40af" : tone === "warning" ? "#92400e" : "#065f46";
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            background: bg,
            color,
            padding: "4px 10px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

