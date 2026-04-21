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

export default function NewCohortPage() {
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
          새 기수
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            fontFamily: "var(--font-serif)",
            color: "var(--forest)",
            margin: "0 0 24px",
          }}
        >
          새 기수 만들기
        </h1>

        <CohortForm mode="create" />
      </main>
    </div>
  );
}
