import { getCohort } from "@neomokdeul/db";
import CohortForm from "../CohortForm";

export const dynamic = "force-dynamic";

export default async function EditCohortPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cohort = await getCohort(id);

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
        <a href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>홈</a>
        {" / "}
        <a href="/cohorts" style={{ color: "var(--text-muted)", textDecoration: "none" }}>기수 관리</a>
        {" / "}
        {cohort ? cohort.name : id}
      </div>

      {!cohort ? (
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--text)",
              margin: "0 0 16px",
            }}
          >
            기수를 찾을 수 없습니다.
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
            ID{" "}
            <code
              style={{
                background: "var(--surface-2)",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {id}
            </code>
            에 해당하는 기수가 없습니다.
          </p>
          <a
            href="/cohorts"
            style={{
              color: "var(--accent)",
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
              fontSize: 22,
              fontWeight: 600,
              color: "var(--text)",
              margin: "0 0 24px",
            }}
          >
            {cohort.name} 편집
          </h1>
          <CohortForm mode="edit" cohort={cohort} />
        </>
      )}
    </div>
  );
}
