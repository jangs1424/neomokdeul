import Reveal from "./Reveal";

type Review = {
  body: string;
  who: string;
};

const reviews: Review[] = [
  {
    body: "디테일이 미쳐서 매일 감탄했어요. 너무 퀄리티 있게 신경 써주신 게 느껴졌습니다.",
    who: "@0820_cohort",
  },
  {
    body: "대화가 너무 잘 통해서 미션을 할 필요가 없었어요. 진짜 소울메이트 찾은 기분.",
    who: "@0820_cohort",
  },
  {
    body: "추가 매칭된 분과 더 즐거웠어요. 두 명 매칭 구조가 진짜 좋더라고요.",
    who: "@0924_cohort",
  },
  {
    body: "5일간 설렜어요. 다음 기수에 또 참여하고 싶습니다 !",
    who: "@1218_cohort",
  },
];

export default function Reviews() {
  return (
    <Reveal as="section" id="reviews" className="reviews-section">
      <div className="wrap">
        <div className="essence-head">
          <div className="section-label">Real Stories</div>
          <h2>
            이렇게
            <br />
            만났어요 <span className="hand">(진짜!)</span>
          </h2>
        </div>
        <div className="reviews-grid">
          {reviews.map((r, i) => (
            <div className="review" key={i}>
              <div className="review-quote">&quot;</div>
              <div className="review-body">{r.body}</div>
              <div className="review-meta">
                <span className="who">{r.who}</span>
                <span className="stars">★★★★★</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
