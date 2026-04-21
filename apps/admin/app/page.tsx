const navItems = [
  { label: "신청 관리", href: "#" },
  { label: "매칭 실행", href: "#" },
  { label: "참가자", href: "#" },
  { label: "블랙리스트", href: "#" },
  { label: "문자 발송", href: "#" },
  { label: "설정", href: "#" },
];

const cards = [
  { title: "대기 중 신청", value: "0", hint: "심사 대기" },
  { title: "오늘 문자 발송 예정", value: "0", hint: "예약된 SMS" },
  { title: "최근 매칭", value: "0", hint: "최근 7일" },
];

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <aside
        className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r"
        style={{ background: "var(--cream)", borderColor: "var(--line)" }}
      >
        <div
          className="px-6 py-6 text-lg"
          style={{ fontFamily: "var(--font-serif)", color: "var(--forest)" }}
        >
          Socially · Admin
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded px-3 py-2 text-sm transition-colors hover:bg-white/50"
              style={{ color: "var(--ink)" }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <main className="ml-60 flex-1 px-10 py-8">
        <div className="text-xs" style={{ color: "var(--sub)" }}>
          홈 / 대시보드
        </div>
        <h1
          className="mt-2 text-3xl font-bold"
          style={{ fontFamily: "var(--font-serif)", color: "var(--forest)" }}
        >
          오늘의 작업
        </h1>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-lg p-5"
              style={{
                background: "var(--cream-2)",
                border: "1px solid rgba(26, 77, 46, 0.1)",
              }}
            >
              <div className="text-sm" style={{ color: "var(--sub)" }}>
                {card.title}
              </div>
              <div
                className="mt-3 text-3xl font-bold"
                style={{ color: "var(--forest)" }}
              >
                {card.value}
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--sub)" }}>
                {card.hint}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
