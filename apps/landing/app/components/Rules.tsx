import Reveal from "./Reveal";

export default function Rules() {
  return (
    <Reveal as="section" id="rules" style={{ padding: 0 }}>
      <div className="rules-section">
        <div className="rules-head">
          <div className="rules-hand">★ our promises ★</div>
          <h2>
            세 가지 약속,
            <br />
            우리가 <em>지킵니다.</em>
          </h2>
        </div>
        <div className="rules-grid">
          <div className="rule">
            <div className="rule-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#1a4d2e" strokeWidth="2" />
                <path
                  d="M5 21 Q5 14 12 14 Q19 14 19 21"
                  stroke="#1a4d2e"
                  strokeWidth="2"
                  fill="none"
                />
                <line
                  x1="3"
                  y1="3"
                  x2="21"
                  y2="21"
                  stroke="#1a4d2e"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <h3>얼굴 비공개</h3>
            <p>프로그램 끝날 때까지 얼굴 공개 없음. 오직 목소리만.</p>
          </div>
          <div className="rule">
            <div className="rule-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="#1a4d2e"
                  strokeWidth="2"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="#1a4d2e"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3>호스트 심사</h3>
            <p>음성 자소 + 동기까지 확인. 아무나 들어올 수 없어요.</p>
          </div>
          <div className="rule">
            <div className="rule-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L3 9l2 12h14l2-12z"
                  stroke="#1a4d2e"
                  strokeWidth="2"
                  fill="none"
                />
                <circle cx="12" cy="14" r="3" fill="#1a4d2e" />
              </svg>
            </div>
            <h3>잠수 보호</h3>
            <p>상대가 잠수하면 다음 기수 50% 쿠폰. 무조건 보상.</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
