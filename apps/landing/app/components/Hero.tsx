export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg"></div>
      <div className="wrap">
        <div className="hero-card">
          <div className="hero-top">
            <div className="hero-kicker">다음 기수 모집 중 ✨</div>
            <div className="hero-time">
              26 APRIL 2026 · <span>COHORT 04</span>
            </div>
          </div>

          <h1 className="hero-headline">
            너의 <span className="italic">목소리</span>
            <br />
            들려오는 <span className="accent">8일</span>.
          </h1>

          <p className="hero-sub">
            얼굴 대신 <strong>목소리부터</strong> 시작되는 익명 전화 실험.
            <br />
            AI가 골라준 두 소울메이트 후보와 3일씩, 솔직하게.
          </p>

          <div className="hero-actions">
            <a
              href="#apply"
              className="btn-yellow"
              style={{ padding: "16px 28px", fontSize: 15 }}
            >
              5월 기수 신청하기 →
            </a>
            <a
              href="#journey"
              style={{
                color: "var(--forest)",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              8일 여정 먼저 보기
            </a>
          </div>

          <div className="hero-handle">@socially_official</div>

          <div className="hero-stats">
            <div className="stat">
              <div className="num">
                4.47
                <span style={{ fontSize: 18, color: "var(--sub)" }}> / 5</span>
              </div>
              <div className="label">평균 만족도</div>
            </div>
            <div className="stat">
              <div className="num">
                106
                <span style={{ fontSize: 18, color: "var(--sub)" }}> 명</span>
              </div>
              <div className="label">누적 참가자</div>
            </div>
            <div className="stat">
              <div className="num">
                91
                <span style={{ fontSize: 18, color: "var(--sub)" }}>%</span>
              </div>
              <div className="label">재참가 의사</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
