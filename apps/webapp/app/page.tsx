import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '../lib/token';
import {
  getApplication,
  getCohort,
  getMatchingForApplication,
  getMatchResponseByApplication,
  type Application,
  type Cohort,
} from '@neomokdeul/db';
import { computeProgramDay, type ProgramDay } from '../lib/program';
import { getMission, MISSIONS } from '../lib/missions';
import { PartnerCard } from './PartnerCard';
import { MissionCard } from './MissionCard';

export const dynamic = 'force-dynamic';

type AppState = 'onboarding' | 'running' | 'ended';

export default async function HomePage() {
  const jar = await cookies();
  const token = jar.get('socially_session')?.value;
  if (!token) redirect('/expired');
  const payload = verifyToken(token);
  if (!payload) redirect('/expired');

  const [me, cohort] = await Promise.all([
    getApplication(payload.appId),
    getCohort(payload.cohortId),
  ]);
  if (!me || !cohort) redirect('/expired');

  const matchResponse = await getMatchResponseByApplication(me.id);
  const p = computeProgramDay(cohort.programStartDate, cohort.programEndDate);

  const state: AppState = p.isAfterEnd ? 'ended' : p.isBeforeStart ? 'onboarding' : 'running';

  const currentRound: 1 | 2 = p.round === 1 ? 1 : 2;
  const matching = state === 'running'
    ? await getMatchingForApplication(me.id, currentRound)
    : null;
  const published = !!matching && matching.status === 'published';
  let partnerApp: Application | null = null;
  if (matching && published) {
    const partnerId = matching.maleApplicationId === me.id
      ? matching.femaleApplicationId
      : matching.maleApplicationId;
    partnerApp = await getApplication(partnerId);
  }

  const missionDay = Math.max(1, Math.min(8, p.day));
  const mission = getMission(missionDay) ?? getMission(1)!;

  const matchFormClosesMs = cohort.matchFormClosesAt
    ? new Date(cohort.matchFormClosesAt).getTime()
    : null;
  const matchFormClosed = matchFormClosesMs !== null && Date.now() > matchFormClosesMs;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 56 }}>
        <AppHeader participantName={me.name} cohortName={cohort.name} state={state} p={p} />

        {state === 'onboarding' && (
          <OnboardingView
            me={me}
            cohort={cohort}
            hasMatchResponse={!!matchResponse}
            matchFormClosed={matchFormClosed}
            p={p}
          />
        )}

        {state === 'running' && (
          <RunningView
            partnerApp={partnerApp}
            published={published}
            round={currentRound}
            mission={mission}
            hasMatchResponse={!!matchResponse}
            matchFormClosed={matchFormClosed}
            p={p}
          />
        )}

        {state === 'ended' && (
          <EndedView cohort={cohort} hasMatchResponse={!!matchResponse} />
        )}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

function AppHeader({
  participantName,
  cohortName,
  state,
  p,
}: {
  participantName: string;
  cohortName: string;
  state: AppState;
  p: ProgramDay;
}) {
  const stageLabel =
    state === 'onboarding' ? `D-${p.daysUntilStart} 시작`
    : state === 'ended' ? '프로그램 종료'
    : `Day ${p.day} / 8`;

  return (
    <header
      style={{
        padding: '28px 24px 20px',
        borderBottom: '1px solid var(--line)',
        background: '#fff',
      }}
    >
      {/* Brand row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--green)',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}
        >
          Socially
        </span>
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 12,
            color: 'var(--green-strong)',
            background: 'var(--mint)',
            padding: '5px 10px',
            borderRadius: 999,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          {stageLabel}
        </span>
      </div>

      {/* Participant name */}
      <div style={{ marginTop: 22 }}>
        <div
          style={{
            fontSize: 12,
            color: 'var(--muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Welcome
        </div>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            lineHeight: 1.2,
            marginTop: 6,
          }}
        >
          {participantName}<span style={{ color: 'var(--muted)', fontWeight: 500 }}>님,</span>
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--muted)',
            marginTop: 6,
            lineHeight: 1.6,
          }}
        >
          너의 목소리가 들려 · <span style={{ color: 'var(--text)' }}>{cohortName}</span>
        </p>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding View
// ─────────────────────────────────────────────────────────────────────────────

function OnboardingView({
  me: _me,
  cohort,
  hasMatchResponse,
  matchFormClosed,
  p,
}: {
  me: Application;
  cohort: Cohort;
  hasMatchResponse: boolean;
  matchFormClosed: boolean;
  p: ProgramDay;
}) {
  const startLabel = formatDateKo(cohort.programStartDate);
  const endLabel = formatDateKo(cohort.programEndDate);
  const matchFormDeadlineLabel = cohort.matchFormClosesAt
    ? formatDateTimeKo(cohort.matchFormClosesAt)
    : null;

  return (
    <>
      {/* Hero welcome card */}
      <section style={{ padding: '20px 20px 0' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, var(--green-deep) 0%, var(--green-strong) 100%)',
            color: '#fff',
            borderRadius: 18,
            padding: '28px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -40,
              top: -40,
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.85)',
                padding: '5px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.12)',
              }}
            >
              D-{p.daysUntilStart}
            </span>
            <h2
              style={{
                marginTop: 14,
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.25,
              }}
            >
              곧 시작돼요.<br />
              준비를 함께 해볼까요?
            </h2>
            <p
              style={{
                marginTop: 10,
                fontSize: 13.5,
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.82)',
              }}
            >
              {startLabel} 첫 미션 공개 · 총 8일간 익명 통화로 진행돼요.
            </p>
          </div>
        </div>
      </section>

      {/* Match form CTA (primary action) */}
      <section style={{ padding: '20px 20px 0' }}>
        {matchFormClosed ? (
          <InfoCard
            label="매칭 폼"
            title={hasMatchResponse ? '답변 제출 완료' : '작성 기간이 끝났어요'}
            desc={
              hasMatchResponse
                ? '제출한 답변은 매칭에 반영됩니다.'
                : '기수 담당자에게 문의해 주세요.'
            }
            cta={hasMatchResponse ? { href: '/match-form', label: '내 답변 보기' } : null}
            tone="muted"
          />
        ) : hasMatchResponse ? (
          <InfoCard
            label="매칭 폼"
            title="답변이 저장됐어요 ✓"
            desc={
              matchFormDeadlineLabel
                ? `마감 ${matchFormDeadlineLabel}까지 수정할 수 있어요.`
                : '마감 전까지 수정할 수 있어요.'
            }
            cta={{ href: '/match-form', label: '수정하기' }}
            tone="success"
          />
        ) : (
          <PrimaryAction
            label="지금 바로"
            title="매칭 폼 작성하기"
            desc={
              matchFormDeadlineLabel
                ? `${matchFormDeadlineLabel} 전에 답변을 제출해 주세요.`
                : '소울메이트 매칭에 꼭 필요한 답변이에요.'
            }
            href="/match-form"
          />
        )}
      </section>

      {/* Program timeline */}
      <section style={{ padding: '28px 20px 0' }}>
        <SectionHeader label="PROGRAM" title="8일의 여정" />
        <div
          style={{
            marginTop: 14,
            background: 'var(--bg-soft)',
            border: '1px solid var(--line)',
            borderRadius: 16,
            padding: '16px 8px 8px',
          }}
        >
          {MISSIONS.map((m) => (
            <div
              key={m.day}
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr',
                gap: 14,
                padding: '10px 12px',
                alignItems: 'baseline',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'var(--green)',
                }}
              >
                DAY {m.day}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {m.title}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--muted)',
                    marginTop: 2,
                    lineHeight: 1.6,
                  }}
                >
                  {previewPrompt(m.prompt)}
                </div>
              </div>
            </div>
          ))}
          <div
            style={{
              padding: '10px 12px 8px',
              fontSize: 12,
              color: 'var(--muted)',
            }}
          >
            프로그램 · {startLabel} ~ {endLabel}
          </div>
        </div>
      </section>

      {/* Prep checklist */}
      <section style={{ padding: '28px 20px 0' }}>
        <SectionHeader label="CHECKLIST" title="준비해 두면 좋아요" />
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          <CheckItem
            title="통화에 집중할 환경"
            desc="조용한 공간, 이어폰/헤드셋 · 저녁 8~10시 사이가 이상적이에요."
          />
          <CheckItem
            title="열린 마음"
            desc="외모·스펙 대신 목소리와 대화 결로만 교감하는 여정이에요."
          />
          <CheckItem
            title="매칭 폼 꼼꼼 작성"
            desc="답변이 구체적일수록 더 잘 맞는 파트너를 찾아드려요."
          />
        </div>
      </section>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Running View
// ─────────────────────────────────────────────────────────────────────────────

function RunningView({
  partnerApp,
  published,
  round,
  mission,
  hasMatchResponse,
  matchFormClosed,
  p: _p,
}: {
  partnerApp: Application | null;
  published: boolean;
  round: 1 | 2;
  mission: ReturnType<typeof getMission> extends infer T ? NonNullable<T> : never;
  hasMatchResponse: boolean;
  matchFormClosed: boolean;
  p: ProgramDay;
}) {
  return (
    <>
      {/* Match form ticker (if not yet filled) */}
      {!matchFormClosed && !hasMatchResponse && (
        <section style={{ padding: '16px 20px 0' }}>
          <PrimaryAction
            label="지금 필요해요"
            title="매칭 폼을 먼저 작성해 주세요"
            desc="답변이 없으면 파트너 매칭이 되지 않아요."
            href="/match-form"
            compact
          />
        </section>
      )}

      {!matchFormClosed && hasMatchResponse && (
        <section style={{ padding: '12px 20px 0' }}>
          <MiniLink href="/match-form" label="✓ 매칭 폼 제출됨 · 수정/보기 →" />
        </section>
      )}

      {matchFormClosed && hasMatchResponse && (
        <section style={{ padding: '12px 20px 0' }}>
          <MiniLink href="/match-form" label="매칭 폼 · 내 답변 보기 →" tone="muted" />
        </section>
      )}

      <PartnerCard partnerApp={partnerApp} round={round} published={published} />

      <MissionCard mission={mission} />

      <section style={{ padding: '12px 20px 0' }}>
        <a
          href="#"
          style={{
            display: 'block',
            padding: '14px 16px',
            background: 'var(--bg-soft)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--muted)',
            fontWeight: 500,
          }}
        >
          매칭 파트너와 오픈채팅하기 →
        </a>
      </section>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ended View
// ─────────────────────────────────────────────────────────────────────────────

function EndedView({
  cohort,
  hasMatchResponse,
}: {
  cohort: Cohort;
  hasMatchResponse: boolean;
}) {
  return (
    <>
      <section style={{ padding: '28px 20px 0' }}>
        <div
          style={{
            background: 'var(--bg-soft)',
            border: '1px solid var(--line)',
            borderRadius: 18,
            padding: '28px 24px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--green)',
            }}
          >
            THANK YOU
          </span>
          <h2
            style={{
              marginTop: 10,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              lineHeight: 1.3,
            }}
          >
            8일의 여정이<br />
            마무리됐어요
          </h2>
          <p
            style={{
              marginTop: 12,
              fontSize: 14,
              color: 'var(--muted)',
              lineHeight: 1.7,
            }}
          >
            {cohort.name}에 함께해 주셔서 감사해요.<br />
            따뜻했던 순간들이 오래 남길 바랄게요.
          </p>
        </div>
      </section>

      <section style={{ padding: '20px 20px 0' }}>
        <SectionHeader label="AFTER" title="애프터 모임" />
        <div
          style={{
            marginTop: 14,
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: 14,
            padding: '18px 18px',
          }}
        >
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            프로그램이 끝난 뒤, 참가자들이 오프라인으로 모이는 자리를 준비 중이에요. 안내 받으신
            분들께 별도로 연락드릴게요.
          </p>
        </div>
      </section>

      {hasMatchResponse && (
        <section style={{ padding: '20px 20px 0' }}>
          <MiniLink href="/match-form" label="내 매칭 폼 답변 보기 →" tone="muted" />
        </section>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI pieces
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--green)',
        }}
      >
        {label}
      </div>
      <h3
        style={{
          marginTop: 6,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
        }}
      >
        {title}
      </h3>
    </div>
  );
}

function PrimaryAction({
  label,
  title,
  desc,
  href,
  compact,
}: {
  label: string;
  title: string;
  desc: string;
  href: string;
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      style={{
        display: 'block',
        background: 'var(--green)',
        color: '#fff',
        borderRadius: 16,
        padding: compact ? '16px 18px' : '22px 22px',
        boxShadow: '0 12px 30px -14px rgba(10,74,48,0.45)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.8)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: compact ? 16 : 19,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.6,
        }}
      >
        {desc}
      </div>
      <div
        style={{
          marginTop: compact ? 10 : 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          padding: '7px 14px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.18)',
          color: '#fff',
        }}
      >
        바로가기 →
      </div>
    </a>
  );
}

function InfoCard({
  label,
  title,
  desc,
  cta,
  tone,
}: {
  label: string;
  title: string;
  desc: string;
  cta: { href: string; label: string } | null;
  tone: 'success' | 'muted';
}) {
  const bg = tone === 'success' ? 'var(--mint)' : 'var(--bg-soft)';
  const border = tone === 'success' ? 'var(--green)' : 'var(--line)';
  const labelColor = tone === 'success' ? 'var(--green-strong)' : 'var(--muted)';
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: labelColor,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--ink)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
        {desc}
      </div>
      {cta && (
        <a
          href={cta.href}
          style={{
            display: 'inline-block',
            marginTop: 12,
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--green-strong)',
            padding: '7px 14px',
            borderRadius: 999,
            background: '#fff',
            border: '1px solid var(--line-strong)',
          }}
        >
          {cta.label} →
        </a>
      )}
    </div>
  );
}

function CheckItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'grid',
        gridTemplateColumns: '28px 1fr',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 10,
          background: 'var(--mint)',
          color: 'var(--green-strong)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        ✓
      </span>
      <div>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--muted)',
            marginTop: 2,
            lineHeight: 1.65,
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );
}

function MiniLink({
  href,
  label,
  tone,
}: {
  href: string;
  label: string;
  tone?: 'muted';
}) {
  const muted = tone === 'muted';
  return (
    <a
      href={href}
      style={{
        display: 'inline-block',
        padding: '7px 14px',
        borderRadius: 999,
        background: muted ? 'rgba(0,0,0,0.04)' : 'var(--mint)',
        border: `1px solid ${muted ? 'var(--line)' : 'var(--green)'}`,
        color: muted ? 'var(--muted)' : 'var(--green-strong)',
        fontSize: 12.5,
        fontWeight: 600,
      }}
    >
      {label}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDateKo(iso: string): string {
  const d = new Date(iso + 'T00:00:00+09:00');
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatDateTimeKo(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${mi}`;
}

function previewPrompt(prompt: string): string {
  const firstLine = prompt.split('\n')[0];
  return firstLine.length > 36 ? firstLine.slice(0, 36) + '…' : firstLine;
}
