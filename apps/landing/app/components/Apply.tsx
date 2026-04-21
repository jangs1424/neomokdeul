import Reveal from "./Reveal";

export default function Apply() {
  return (
    <Reveal as="section" id="apply" className="apply-section">
      <div className="wrap">
        <div className="apply-card">
          <div>
            <div className="apply-hand">just click →</div>
            <div className="apply-en">
              MAY
              <br />
              2026.
            </div>
            <div className="apply-kr">2026년 5월 기수, 지금 모집 중 ✨</div>
            <div className="apply-stats">
              <div>
                <div className="k">진행 기간</div>
                <div className="v">5.15 – 5.22</div>
              </div>
              <div>
                <div className="k">모집 마감</div>
                <div className="v">5.10 금</div>
              </div>
              <div>
                <div className="k">참가비</div>
                <div className="v">₩45,000</div>
              </div>
            </div>
          </div>
          <div className="apply-right">
            <div className="badge">limited seats !</div>
            <h3>
              남녀
              <br />각 15명.
            </h3>
            <p>
              신청 → 호스트 심사(48h 내)
              <br />→ 승인 후 결제 → 프로그램 참여
            </p>
            <a
              href="/apply"
              className="btn-yellow"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "18px 24px",
                fontSize: 16,
              }}
            >
              지금 신청하기 →
            </a>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
