import CohortForm from "../CohortForm";

export default function NewCohortPage() {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
        <a href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>홈</a>
        {" / "}
        <a href="/cohorts" style={{ color: "var(--text-muted)", textDecoration: "none" }}>기수 관리</a>
        {" / "}
        새 기수
      </div>

      <h1
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "var(--text)",
          margin: "0 0 24px",
        }}
      >
        새 기수 만들기
      </h1>

      <CohortForm mode="create" />
    </div>
  );
}
