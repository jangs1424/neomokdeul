export const dynamic = "force-dynamic";

import Link from "next/link";
import { listApplications, listCohorts } from "@neomokdeul/db/store";
import type { Application, Cohort } from "@neomokdeul/db";
import { ParticipantsFilters } from "./ParticipantsFilters";
import { PhoneCell } from "./PhoneCell";

type SP = {
  cohort?: string;
  gender?: string;
  q?: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

const thStyle: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-muted)",
  borderBottom: "1px solid var(--border)",
  background: "var(--surface)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "9px 12px",
  fontSize: 13,
  color: "var(--text)",
  borderBottom: "1px solid var(--border)",
  verticalAlign: "middle",
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "3px 10px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 500,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--text)",
};

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

  // Build cohort maps
  const cohortMap = new Map<string, Cohort>(allCohorts.map((c) => [c.id, c]));
  const cohortBySlug = new Map<string, Cohort>(allCohorts.map((c) => [c.slug, c]));

  // Base: only approved
  const approvedApps = allApps.filter((a: Application) => a.status === "approved");

  // Apply URL-param filters
  const q = (sp.q ?? "").trim().toLowerCase();
  const activeCohort = sp.cohort ? cohortBySlug.get(sp.cohort) ?? null : null;

  const displayApps = approvedApps.filter((a: Application) => {
    if (activeCohort && a.cohortId !== activeCohort.id) return false;
    if (sp.gender && sp.gender !== "all" && a.gender !== sp.gender) return false;
    if (q) {
      const hay = `${a.name} ${a.phone}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Sort: newest approved first (use updatedAt if present, else createdAt)
  const sorted = [...displayApps].sort((a, b) => {
    const ta = new Date(a.updatedAt ?? a.createdAt).getTime();
    const tb = new Date(b.updatedAt ?? b.createdAt).getTime();
    return tb - ta;
  });

  // Stats (over ALL approved, not filtered)
  const totalCount = approvedApps.length;
  const maleCount = approvedApps.filter((a: Application) => a.gender === "male").length;
  const femaleCount = approvedApps.filter((a: Application) => a.gender === "female").length;
  const cohortCount = new Set(approvedApps.map((a: Application) => a.cohortId)).size;

  // Cohorts that have at least one approved participant (for filter dropdown)
  const cohortIdsWithParticipants = new Set(approvedApps.map((a: Application) => a.cohortId));
  const filterCohorts = allCohorts
    .filter((c) => cohortIdsWithParticipants.has(c.id))
    .sort((a, b) => (a.programStartDate > b.programStartDate ? -1 : 1));

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
        홈 / 참가자
      </div>

      {/* Header */}
      <h1
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "var(--text)",
          margin: 0,
        }}
      >
        참가자
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          marginTop: 6,
          marginBottom: 20,
        }}
      >
        승인된 신청자 누적 리스트. 기수별·성별·MBTI별 필터 가능.
      </p>

      {/* Stat chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <span style={chipStyle}>
          누적 참가자&nbsp;
          <strong style={{ color: "var(--accent)" }}>{totalCount}명</strong>
        </span>
        <span style={chipStyle}>
          남&nbsp;<strong>{maleCount}명</strong>
          &nbsp;·&nbsp;여&nbsp;<strong>{femaleCount}명</strong>
        </span>
        <span style={chipStyle}>
          기수 수&nbsp;<strong>{cohortCount}개</strong>
        </span>
      </div>

      {/* Filters (client component) */}
      <ParticipantsFilters cohorts={filterCohorts} />

      {/* Table or empty state */}
      {sorted.length === 0 ? (
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
          아직 승인된 참가자가 없어요.
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
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>이름</th>
                  <th style={thStyle}>성별</th>
                  <th style={thStyle}>년생</th>
                  <th style={thStyle}>직업</th>
                  <th style={thStyle}>지역</th>
                  <th style={thStyle}>MBTI</th>
                  <th style={thStyle}>기수명</th>
                  <th style={thStyle}>승인일시</th>
                  <th style={thStyle}>전화번호</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((app: Application) => {
                  const cohort = cohortMap.get(app.cohortId);
                  const approvedAt = app.updatedAt ?? app.createdAt;
                  return (
                    <tr
                      key={app.id}
                      style={{ transition: "background 0.1s" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background =
                          "var(--surface)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background =
                          "";
                      }}
                    >
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 500 }}>{app.name}</span>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "1px 7px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 500,
                            background:
                              app.gender === "male"
                                ? "var(--info-soft)"
                                : "var(--danger-soft)",
                            color:
                              app.gender === "male" ? "#1d4ed8" : "#b91c1c",
                          }}
                        >
                          {app.gender === "male" ? "남" : "여"}
                        </span>
                      </td>
                      <td style={tdStyle}>{app.birthYear}</td>
                      <td style={{ ...tdStyle, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {app.occupation || "—"}
                      </td>
                      <td style={tdStyle}>{app.region || "—"}</td>
                      <td style={tdStyle}>
                        {app.mbti ? (
                          <span
                            style={{
                              fontSize: 12,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "var(--accent-soft)",
                              color: "var(--accent)",
                              fontWeight: 600,
                            }}
                          >
                            {app.mbti}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={tdStyle}>
                        {cohort ? (
                          <Link
                            href={`/cohorts/${cohort.id}`}
                            style={{
                              color: "var(--accent)",
                              fontWeight: 500,
                              textDecoration: "underline",
                              fontSize: 13,
                            }}
                          >
                            {cohort.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ ...tdStyle, color: "var(--text-muted)", fontSize: 12 }}>
                        {formatDate(approvedAt)}
                      </td>
                      <td style={tdStyle}>
                        <PhoneCell phone={app.phone} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
