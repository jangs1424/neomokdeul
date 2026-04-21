import ApplyForm from "./ApplyForm";
import Link from "next/link";
import { getActiveCohort } from "@neomokdeul/db";

export default async function ApplyPage() {
  const cohort = await getActiveCohort();

  if (!cohort) {
    return (
      <main
        style={{
          background: "var(--cream)",
          minHeight: "100vh",
          paddingTop: 120,
          paddingBottom: 80,
        }}
      >
        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--forest)",
              marginBottom: 16,
            }}
          >
            현재 모집 중인 기수가 없습니다
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--sub)",
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            인스타그램에서 다음 공지를 기다려주세요.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              background: "var(--forest)",
              color: "#fff",
              borderRadius: 999,
              padding: "14px 32px",
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        paddingTop: 120,
        paddingBottom: 80,
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 14,
            color: "var(--forest)",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 32,
            textDecoration: "none",
          }}
        >
          ← 홈으로
        </Link>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "var(--forest)",
            marginBottom: 8,
          }}
        >
          {cohort.name} 신청
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "var(--sub)",
            marginBottom: 32,
          }}
        >
          간단한 심사 후 승인 여부를 문자로 안내드려요.
        </p>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid var(--line)",
            marginBottom: 40,
          }}
        />

        <ApplyForm cohort={cohort} />
      </div>
    </main>
  );
}
