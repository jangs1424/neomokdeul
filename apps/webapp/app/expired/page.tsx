export const dynamic = 'force-dynamic';

export default function ExpiredPage() {
  return (
    <main style={{ padding: '80px 24px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 14 }}>
        세션이 만료되었어요
      </h1>
      <p style={{ color: 'var(--sub)', lineHeight: 1.7, fontSize: 15 }}>
        SMS로 받은 최신 링크를 다시 눌러주세요.<br />
        문의는 호스트(@socially_official) 인스타그램으로 연락해주세요.
      </p>
    </main>
  );
}
