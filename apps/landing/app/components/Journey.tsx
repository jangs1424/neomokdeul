import Reveal from "./Reveal";

export default function Journey() {
  return (
    <Reveal as="section" id="journey">
      <div className="wrap">
        <div className="essence-head">
          <div className="section-label">8 Days Journey</div>
          <h2>
            하루씩,
            <br />
            천천히 <span className="hand">만나요.</span>
          </h2>
        </div>
        <div>
          <div className="journey-row">
            <div className="journey-day">
              01<small>DAY ONE</small>
            </div>
            <div>
              <div className="journey-title">온라인 OT + 매칭 폼</div>
              <div className="journey-desc">
                Zoom으로 프로그램 소개. 이어서 26문항 매칭 폼 작성 — 이 답변이 AI
                매칭의 재료가 됩니다.
              </div>
            </div>
            <div className="journey-hand">kick off ↗</div>
          </div>
          <div className="journey-row">
            <div className="journey-day">
              02–04<small>FIRST PARTNER</small>
            </div>
            <div>
              <div className="journey-title">첫 번째 소울메이트와 3일</div>
              <div className="journey-desc">
                AI가 매칭한 첫 파트너와 익명 채팅·통화. 매일 09시, 미션과 힌트가
                웹에서 열려요.
              </div>
            </div>
            <div className="journey-hand">call me ♥</div>
          </div>
          <div className="journey-row">
            <div className="journey-day">
              05–07<small>SECOND PARTNER</small>
            </div>
            <div>
              <div className="journey-title">두 번째 소울메이트와 3일</div>
              <div className="journey-desc">
                새 파트너 공개. 비교하며 진짜 내 사람을 찾아가요. &quot;이어가기&quot;
                투표도 가능.
              </div>
            </div>
            <div className="journey-hand">compare !</div>
          </div>
          <div className="journey-row">
            <div className="journey-day">
              08<small>FINAL</small>
            </div>
            <div>
              <div className="journey-title">최종 매칭 & 연락처 교환</div>
              <div className="journey-desc">
                서로 &quot;예&quot;를 선택하면, 진짜 연락처가 자동으로 교환돼요. 그리고
                얼굴을 봅니다.
              </div>
            </div>
            <div className="journey-hand" style={{ color: "var(--forest)" }}>
              finally ★
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
