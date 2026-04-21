import Reveal from "./Reveal";

export default function Essence() {
  return (
    <Reveal as="section" id="essence">
      <div className="wrap">
        <div className="essence-head">
          <div className="section-label">Brand Essence</div>
          <h2>
            왜,
            <br />
            우리일까. <span className="hand">음...</span>
          </h2>
          <p>
            소개팅 앱도, 문토·트레바리도 해봤는데 뭔가 아쉬웠다면. 너목들은 딱 세
            가지가 달라요. 남들이 안 하는 규칙으로, 조금 더 솔직한 인연을 만들어요.
          </p>
        </div>

        <div className="essence">
          <div className="essence-item">
            <div className="essence-num">01</div>
            <div className="essence-hand-mark">voice first ↓</div>
            <div className="essence-en">Voice.</div>
            <div className="essence-kr">목소리가 먼저</div>
            <div className="essence-illu">
              <svg width="180" height="160" viewBox="0 0 180 160" fill="none">
                <circle cx="90" cy="80" r="60" fill="#1a4d2e" opacity=".1" />
                <path
                  d="M40 85 Q40 30 90 30 Q140 30 140 85"
                  stroke="#1a4d2e"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <rect
                  x="28"
                  y="78"
                  width="26"
                  height="44"
                  rx="10"
                  fill="#f4c430"
                  stroke="#1a4d2e"
                  strokeWidth="3"
                />
                <rect
                  x="126"
                  y="78"
                  width="26"
                  height="44"
                  rx="10"
                  fill="#1a4d2e"
                  stroke="#1a4d2e"
                  strokeWidth="3"
                />
                <g stroke="#1a4d2e" strokeWidth="3" strokeLinecap="round">
                  <line x1="70" y1="138" x2="70" y2="146" />
                  <line x1="80" y1="132" x2="80" y2="152" />
                  <line x1="90" y1="126" x2="90" y2="158" />
                  <line x1="100" y1="132" x2="100" y2="152" />
                  <line x1="110" y1="138" x2="110" y2="146" />
                </g>
              </svg>
            </div>
            <div className="essence-body">
              외모로 먼저 판단되는 피곤한 만남은 이제 그만. 목소리 결 하나로 상대가
              누구인지 알아가요.
            </div>
          </div>

          <div className="essence-item">
            <div className="essence-num">02</div>
            <div className="essence-hand-mark">3 + 3 days!</div>
            <div className="essence-en">Two.</div>
            <div className="essence-kr">두 명과 3일씩</div>
            <div className="essence-illu">
              <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
                <circle cx="100" cy="80" r="58" fill="#f4c430" opacity=".25" />
                {/* left person */}
                <circle
                  cx="65"
                  cy="58"
                  r="16"
                  fill="#f5efd8"
                  stroke="#1a4d2e"
                  strokeWidth="3"
                />
                <path
                  d="M38 115 Q38 88 65 88 Q92 88 92 115 L92 140 L38 140 Z"
                  fill="#1a4d2e"
                  stroke="#1a4d2e"
                  strokeWidth="3"
                />
                {/* right person */}
                <circle
                  cx="135"
                  cy="58"
                  r="16"
                  fill="#f5efd8"
                  stroke="#1a4d2e"
                  strokeWidth="3"
                />
                <path
                  d="M108 115 Q108 88 135 88 Q162 88 162 115 L162 140 L108 140 Z"
                  fill="#f4c430"
                  stroke="#1a4d2e"
                  strokeWidth="3"
                />
                {/* heart */}
                <path
                  d="M100 32 C 93 24 80 30 80 40 C 80 50 100 62 100 62 C 100 62 120 50 120 40 C 120 30 107 24 100 32Z"
                  fill="#e85d4d"
                  stroke="#1a4d2e"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
            <div className="essence-body">
              한 명으론 아쉬우셨죠. 두 소울메이트 후보와 3일씩 만나고, 비교해서 진짜
              내 사람을 찾아요.
            </div>
          </div>

          <div className="essence-item">
            <div className="essence-num">03</div>
            <div className="essence-hand-mark">AI + host ✓</div>
            <div className="essence-en">Match.</div>
            <div className="essence-kr">AI + 호스트 3단 매칭</div>
            <div className="essence-illu">
              <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
                <circle cx="100" cy="80" r="58" fill="#1a4d2e" opacity=".1" />
                <rect
                  x="48"
                  y="55"
                  width="104"
                  height="72"
                  rx="6"
                  fill="#f5efd8"
                  stroke="#1a4d2e"
                  strokeWidth="3"
                />
                <path
                  d="M48 55 L100 102 L152 55"
                  stroke="#1a4d2e"
                  strokeWidth="3"
                  fill="none"
                  strokeLinejoin="round"
                />
                <circle
                  cx="100"
                  cy="125"
                  r="10"
                  fill="#e85d4d"
                  stroke="#1a4d2e"
                  strokeWidth="2.5"
                />
                <line
                  x1="68"
                  y1="82"
                  x2="86"
                  y2="82"
                  stroke="#1a4d2e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1="114"
                  y1="82"
                  x2="132"
                  y2="82"
                  stroke="#1a4d2e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <text
                  x="100"
                  y="44"
                  textAnchor="middle"
                  fontFamily="Caveat"
                  fontSize="18"
                  fill="#1a4d2e"
                  fontWeight="700"
                >
                  to. you
                </text>
              </svg>
            </div>
            <div className="essence-body">
              26문항 설문 + Claude AI 분석 + 호스트 직접 심사. 성향·가치관·취향까지
              세 번 필터링.
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
