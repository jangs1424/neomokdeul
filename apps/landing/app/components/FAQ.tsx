import Reveal from "./Reveal";

type FAQItem = {
  q: string;
  a: string;
};

const faqs: FAQItem[] = [
  {
    q: "얼굴이 공개되나요?",
    a: "아니요. 프로그램 전 기간 동안 얼굴은 공개되지 않아요. 최종 매칭 후 상호 동의한 경우에만 연락처를 교환합니다.",
  },
  {
    q: "참가 대상이 어떻게 되나요?",
    a: "25~33세 직장인 남녀를 주 대상으로 해요. 호스트가 신청서와 음성 자기소개를 심사한 후 승인 여부를 결정합니다.",
  },
  {
    q: "어떤 앱으로 진행되나요?",
    a: "카카오톡 오픈채팅(1:1)으로 파트너와 소통하고, 너목들 웹페이지에서 매일 미션과 힌트를 확인해요.",
  },
  {
    q: "매칭이 마음에 안 들면 어떻게 되나요?",
    a: '5일차에 자동으로 두 번째 파트너가 공개돼요. 첫 파트너와 이어가고 싶으시면 "이어가기" 투표로 유지할 수 있어요.',
  },
  {
    q: "환불이 가능한가요?",
    a: "프로그램 시작 전까지는 전액 환불 가능해요. 시작 이후엔 환불이 어렵지만, 상대방 잠수 등으로 경험이 훼손된 경우 다음 기수 50% 할인 쿠폰을 드려요.",
  },
];

export default function FAQ() {
  return (
    <Reveal as="section" id="faq" className="faq-section">
      <div className="wrap-narrow">
        <div className="essence-head">
          <div className="section-label">FAQ</div>
          <h2>궁금한 것들.</h2>
        </div>
        <div>
          {faqs.map((f, i) => (
            <details className="faq" key={i}>
              <summary>
                {f.q} <span className="plus"></span>
              </summary>
              <div className="body">{f.a}</div>
            </details>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
