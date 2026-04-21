import { getCohort } from "@neomokdeul/db";
import CohortForm from "../CohortForm";

const navItems = [
  { label: "신청 관리", href: "/" },
  { label: "기수 관리", href: "/cohorts" },
  { label: "매칭 실행", href: "#" },
  { label: "참가자", href: "#" },
  { label: "블랙리스트", href: "#" },
  { label: "문자 발송", href: "#" },
  { label: "설정", href: "#" },
];

export const dynamic = "force-dynamic";

export default async function EditCohortPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cohort = await getCohort(id);

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
        <div style={{ fontSize: 12, color: "var(--sub)", marginBottom: 8 }}>
          <a href="/" style={{ color: "var(--sub)", textDecoration: "none" }}>홈</a>
          {" / "}
          <a href="/cohorts" style={{ color: "var(--sub)", textDecoration: "none" }}>기수 관리</a>
          {" / "}
          {cohort ? cohort.name : id}
        </div>

        {!cohort ? (
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--forest)",
                margin: "0 0 16px",
              }}
            >
              기수를 찾을 수 없습니다.
            </h1>
            <p style={{ color: "var(--sub)", fontSize: 14, marginBottom: 20 }}>
              ID <code style={{ background: "var(--cream)", padding: "2px 6px", borderRadius: 4 }}>{id}</code>에 해당하는 기수가 없습니다.
            </p>
            <a
              href="/cohorts"
              style={{
                color: "var(--forest)",
                fontSize: 14,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              ← 기수 목록으로 돌아가기
            </a>
          </div>
        ) : (
          <>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                fontFamily: "var(--font-serif)",
                color: "var(--forest)",
                margin: "0 0 24px",
              }}
            >
              {cohort.name} 편집
            </h1>
            <CohortForm mode="edit" cohort={cohort} />
          </>
        )}
      </main>
    </div>
  );
}
