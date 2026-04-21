export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-cream px-6 py-10 md:px-12 md:py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10">
        {/* Day pill */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-forest px-4 py-1.5 text-sm font-semibold tracking-wide text-cream">
            DAY 3 / 8
          </span>
          <span className="font-hand text-xl text-sub">
            너의 목소리가 들려
          </span>
        </div>

        {/* Title */}
        <header className="flex flex-col gap-3">
          <h1 className="font-serif text-5xl font-bold leading-tight text-ink md:text-6xl">
            오늘의 미션.
          </h1>
          <p className="text-base text-sub">
            천천히 읽고, 마음이 움직일 때 문을 열어보세요.
          </p>
        </header>

        {/* Mission card */}
        <section className="rounded-2xl border-2 border-forest bg-cream-2 p-8 shadow-sm">
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-forest">
            Mission · Day 3
          </div>
          <p className="font-serif text-2xl leading-relaxed text-ink md:text-3xl">
            서로에게 &lsquo;가장 좋아하는 노래 한 곡&rsquo;을 추천해주세요.
            그 노래에 얽힌 이야기까지 곁들이면 더 좋아요.
          </p>
          <div className="mt-8">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-yellow px-6 py-3 text-base font-semibold text-ink transition hover:brightness-95"
            >
              힌트 열기 →
            </button>
          </div>
        </section>

        {/* Partner card */}
        <section className="rounded-2xl border border-forest/30 bg-cream-2/60 p-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-sub">
            Partner
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-sub">파트너</span>
              <span className="font-serif text-2xl text-ink">
                @익명의_아메리카노
              </span>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border-2 border-forest px-5 py-2.5 text-sm font-semibold text-forest transition hover:bg-forest hover:text-cream"
            >
              통화 예약하기
            </button>
          </div>
        </section>

        {/* Countdown */}
        <footer className="flex items-center justify-between pt-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-forest-dark px-4 py-1.5 text-sm font-semibold text-cream">
            <span className="h-2 w-2 rounded-full bg-yellow" />
            D-5
          </span>
          <span className="text-xs text-sub">여정 종료까지</span>
        </footer>
      </div>
    </main>
  );
}
