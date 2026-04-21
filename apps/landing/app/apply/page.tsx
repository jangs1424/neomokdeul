import ApplyForm from "./ApplyForm";
import Link from "next/link";

export default function ApplyPage() {
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
          너목들 신청서
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

        <ApplyForm />
      </div>
    </main>
  );
}
