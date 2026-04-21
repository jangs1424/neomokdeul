export const dynamic = "force-dynamic";
export const revalidate = 0;

import { listCohorts, type Cohort, type CohortStatus } from "@neomokdeul/db";

const navItems = [
  { label: "신청 관리", href: "/" },
  { label: "기수 관리", href: "/cohorts" },
  { label: "매칭 실행", href: "#" },
  { label: "참가자", href: "#" },
  { label: "블랙리스트", href: "#" },
  { label: "문자 발송", href: "#" },
  { label: "설정", href: "#" },
];

const STATUS_LABEL: Record<CohortStatus, string> = {
  draft: "초안",
  recruiting: "모집중",
  closed: "마감",
  running: "진행중",
  completed: "완료",
};

const STATUS_STYLE: Record<CohortStatus, React.CSSProperties> = {
  draft: { background: "#e5e7eb", color: "#374151" },
  recruiting: { background: "#d1fae5", color: "#065f46" },
  closed: { background: "#fef3c7", color: "#92400e" },
  running: { background: "#dbeafe", color: "#1e40af" },
  completed: { background: "#f3f4f6", color: "#6b7280" },
};

function StatusPill({ status }: { status: CohortStatus }) {
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

function formatDate(iso: string) {
  return iso?.slice(0, 10) ?? "—";
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default async function CohortsPage() {
  const cohorts = await listCohorts();

  const total = cohorts.length;
  const recruiting = cohorts.filter((c) => c.status === "recruiting").length;
  const running = cohorts.filter((c) => c.status === "running").length;
  const completed = cohorts.filter((c) => c.status === "completed").length;
  const draft = cohorts.filter((c) => c.status === "draft").length;

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
                color: item.href === "/cohorts" ? "var(--forest)" : "var(--ink)",
                textDecoration: "none",
                fontWeight: item.href === "/cohorts" ? 600 : 400,
                background: item.href === "/cohorts" ? "var(--cream)" : "transparent",
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
          <a href="/" style={{ color: "var(--sub)", textDecoration: "none" }}>홈</a>
          {" / "}
          기수 관리
        </div>

        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              fontFamily: "var(--font-serif)",
              color: "var(--forest)",
              margin: 0,
            }}
          >
            기수 관리
          </h1>
          <a
            href="/cohorts/new"
            style={{
              display: "inline-block",
              padding: "8px 18px",
              borderRadius: 8,
              background: "var(--forest)",
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

        <p style={{ fontSize: 13, color: "var(--sub)", marginTop: 4, marginBottom: 24 }}>
          전체 {total} · 모집중 {recruiting} · 진행중 {running} · 완료 {completed} · 초안 {draft}
        </p>

        {/* Table */}
        {cohorts.length === 0 ? (
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
            아직 생성된 기수가 없습니다. 새 기수를 만들어보세요.
          </div>
        ) : (
          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 110px 110px 110px 80px 110px 60px",
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
              <span>기수명</span>
              <span>슬러그</span>
              <span>모집기간</span>
              <span>프로그램기간</span>
              <span>가격</span>
              <span>정원(남/여)</span>
              <span>편집</span>
            </div>

            {cohorts.map((cohort) => (
              <a
                key={cohort.id}
                href={`/cohorts/${cohort.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 110px 110px 110px 80px 110px 60px",
                  padding: "12px 12px",
                  borderBottom: "1px solid var(--line)",
                  fontSize: 13,
                  color: "var(--ink)",
                  alignItems: "center",
                  gap: 8,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <span>
                  <StatusPill status={cohort.status} />
                </span>
                <span style={{ fontWeight: 500 }}>{cohort.name}</span>
                <span style={{ color: "var(--sub)", fontSize: 12, fontFamily: "monospace" }}>{cohort.slug}</span>
                <span style={{ color: "var(--sub)", fontSize: 12 }}>
                  {formatDate(cohort.applyOpensAt)}~{formatDate(cohort.applyClosesAt)}
                </span>
                <span style={{ color: "var(--sub)", fontSize: 12 }}>
                  {formatDate(cohort.programStartDate)}~{formatDate(cohort.programEndDate)}
                </span>
                <span style={{ color: "var(--sub)", fontSize: 12 }}>{formatPrice(cohort.priceKrw)}</span>
                <span style={{ color: "var(--sub)", fontSize: 12 }}>
                  남 {cohort.maxMale} / 여 {cohort.maxFemale}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--forest)",
                    fontWeight: 500,
                  }}
                >
                  편집 →
                </span>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
