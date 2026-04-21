export const dynamic = "force-dynamic";
export const revalidate = 0;

import { listApplications } from "@neomokdeul/db/store";
import type { Application } from "@neomokdeul/db";
import { ActionButtons } from "./ActionButtons";

const navItems = [
  { label: "신청 관리", href: "/" },
  { label: "기수 관리", href: "/cohorts" },
  { label: "매칭 실행", href: "#" },
  { label: "참가자", href: "#" },
  { label: "블랙리스트", href: "#" },
  { label: "문자 발송", href: "#" },
  { label: "설정", href: "#" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  pending: {
    background: "#fef3c7",
    color: "#92400e",
  },
  approved: {
    background: "#d1fae5",
    color: "#065f46",
  },
  rejected: {
    background: "#fee2e2",
    color: "#991b1b",
  },
};

function DetailField({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          color: "var(--sub)",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: multiline ? 1.7 : 1.4,
          color: "var(--ink)",
          whiteSpace: multiline ? "pre-wrap" : "normal",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      style={{
        ...STATUS_STYLE[status],
        padding: "4px 10px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterParam } = await searchParams;
  const allApps = await listApplications();

  const pending = allApps.filter((a) => a.status === "pending").length;
  const approved = allApps.filter((a) => a.status === "approved").length;
  const rejected = allApps.filter((a) => a.status === "rejected").length;
  const total = allApps.length;

  let displayApps: Application[];
  if (filterParam === "pending") {
    displayApps = allApps.filter((a) => a.status === "pending");
  } else if (filterParam === "done") {
    displayApps = allApps.filter((a) => a.status !== "pending");
  } else {
    displayApps = allApps;
  }

  // newest first
  displayApps = [...displayApps].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 16px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    border: "none",
    background: active ? "var(--forest)" : "transparent",
    color: active ? "#fff" : "var(--sub)",
    textDecoration: "none",
    display: "inline-block",
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        className="admin-sidebar"
        style={{
          width: 240,
          minHeight: "100vh",
          background: "var(--cream-2)",
          borderRight: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
        }}
      >
        <div
          style={{
            padding: "24px 24px 16px",
            fontSize: 17,
            fontFamily: "var(--font-serif)",
            color: "var(--forest)",
            borderBottom: "1px solid var(--line)",
          }}
        >
          Socially · Admin
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 12px" }}>
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                display: "block",
                padding: "8px 12px",
                borderRadius: 6,
                fontSize: 14,
                color: "var(--ink)",
                textDecoration: "none",
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="admin-main" style={{ marginLeft: 240, flex: 1, padding: "32px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: "var(--sub)", marginBottom: 8 }}>
          홈 / 신청 관리
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            fontFamily: "var(--font-serif)",
            color: "var(--forest)",
            margin: 0,
          }}
        >
          신청 관리
        </h1>
        <p style={{ fontSize: 13, color: "var(--sub)", marginTop: 6, marginBottom: 24 }}>
          대기 {pending} · 승인 {approved} · 반려 {rejected} · 총 {total}
        </p>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          <a href="/" style={tabStyle(!filterParam || filterParam === "all")}>
            전체
          </a>
          <a href="/?status=pending" style={tabStyle(filterParam === "pending")}>
            대기
          </a>
          <a href="/?status=done" style={tabStyle(filterParam === "done")}>
            처리완료
          </a>
        </div>

        {/* Table */}
        {displayApps.length === 0 ? (
          <div
            style={{
              padding: "48px 0",
              textAlign: "center",
              color: "var(--sub)",
              fontSize: 14,
              border: "1px solid var(--line)",
              borderRadius: 8,
            }}
          >
            신청 내역이 없습니다.
          </div>
        ) : (
          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "72px 70px 44px 50px 120px 90px 80px 110px 1fr",
                padding: "10px 12px",
                background: "var(--cream)",
                borderBottom: "1px solid var(--line)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--sub)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                gap: 8,
              }}
            >
              <span>상태</span>
              <span>이름</span>
              <span>성별</span>
              <span>년생</span>
              <span>전화</span>
              <span>직업</span>
              <span>MBTI</span>
              <span>신청일시</span>
              <span>액션</span>
            </div>

            {displayApps.map((app) => (
              <details key={app.id}>
                <summary
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px 70px 44px 50px 120px 90px 80px 110px 1fr",
                    padding: "12px 12px",
                    borderBottom: "1px solid var(--line)",
                    fontSize: 13,
                    color: "var(--ink)",
                    alignItems: "center",
                    gap: 8,
                    listStyle: "none",
                    cursor: "pointer",
                  }}
                >
                  <span>
                    <StatusPill status={app.status} />
                  </span>
                  <span style={{ fontWeight: 500 }}>{app.name}</span>
                  <span style={{ color: "var(--sub)" }}>
                    {app.gender === "male" ? "남" : "여"}
                  </span>
                  <span style={{ color: "var(--sub)" }}>{app.birthYear}</span>
                  <span style={{ color: "var(--sub)", fontSize: 12 }}>{app.phone}</span>
                  <span style={{ color: "var(--sub)", fontSize: 12 }}>{app.occupation}</span>
                  <span style={{ color: "var(--sub)", fontSize: 12 }}>{app.mbti ?? "—"}</span>
                  <span style={{ color: "var(--sub)", fontSize: 12 }}>{formatDate(app.createdAt)}</span>
                  <span>
                    {app.status === "pending" ? (
                      <ActionButtons id={app.id} />
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--sub)" }}>
                        {app.note ?? "—"}
                      </span>
                    )}
                  </span>
                </summary>
                <div
                  style={{
                    padding: "16px 20px 20px",
                    background: "var(--cream-2)",
                    borderBottom: "1px solid var(--line)",
                    fontSize: 13,
                    color: "var(--ink)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px 32px",
                  }}
                >
                  <DetailField label="거주 지역" value={app.region} />
                  <DetailField label="유입경로" value={app.source} />
                  <DetailField
                    label="통화 가능 시간대"
                    value={app.callTimes?.length ? app.callTimes.join(" · ") : "—"}
                  />
                  <DetailField
                    label="이전 기수 참여"
                    value={app.previousCohort ? "있음" : "없음"}
                  />
                  <div style={{ gridColumn: "1 / -1" }}>
                    <DetailField label="지원 동기" value={app.motivation} multiline />
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
