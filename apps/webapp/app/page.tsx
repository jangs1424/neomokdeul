import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '../lib/token';
import {
  getApplication,
  getCohort,
  getMatchingForApplication,
  getMatchResponseByApplication,
} from '@neomokdeul/db';
import { computeProgramDay } from '../lib/program';
import { getMission } from '../lib/missions';
import { DayHeader } from './DayHeader';
import { PartnerCard } from './PartnerCard';
import { MissionCard } from './MissionCard';

export const dynamic = 'force-dynamic';

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

  // Check whether participant has submitted the Day 1 match form.
  const matchResponse = await getMatchResponseByApplication(me.id);
  const matchFormOpen =
    cohort.status === 'recruiting' || cohort.status === 'running';

  const p = computeProgramDay(cohort.programStartDate, cohort.programEndDate);

  // Resolve current round as 1 | 2 (final counts as round 2 for partner display)
  const currentRound: 1 | 2 = p.round === 1 ? 1 : 2;

  // Fetch matching for this participant in the current round
  const matching = await getMatchingForApplication(me.id, currentRound);
  const published = !!matching && matching.status === 'published';

  let partnerApp = null;
  if (matching) {
    const partnerId =
      matching.maleApplicationId === me.id
        ? matching.femaleApplicationId
        : matching.maleApplicationId;
    partnerApp = await getApplication(partnerId);
  }

  // Mission day: clamp to 1..8
  const missionDay = p.isBeforeStart
    ? 1
    : p.isAfterEnd
      ? 8
      : Math.max(1, Math.min(8, p.day));

  const mission = getMission(missionDay) ?? getMission(1)!;

  return (
    <main
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100vh',
        background: 'var(--bg)',
      }}
    >
      <DayHeader cohort={cohort} />

      {matchFormOpen && (() => {
        const deadlineMs = cohort.matchFormClosesAt
          ? new Date(cohort.matchFormClosesAt).getTime()
          : null;
        const closed =
          deadlineMs !== null && Number.isFinite(deadlineMs) && Date.now() > deadlineMs;

        if (closed) {
          if (!matchResponse) return null;
          return (
            <div style={{ padding: '12px 20px 0' }}>
              <a
                href="/match-form"
                style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  background: 'rgba(0,0,0,0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 999,
                  textDecoration: 'none',
                  color: 'var(--sub)',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                매칭 폼 · 내 답변 보기 →
              </a>
            </div>
          );
        }

        return (
          <div style={{ padding: '12px 20px 0' }}>
            {!matchResponse ? (
              <a
                href="/match-form"
                style={{
                  display: 'block',
                  padding: '14px 16px',
                  background: '#fff6d6',
                  border: '1px solid #e6d57a',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: '#6b5d1a',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                ⚠ 매칭 폼 작성이 필요합니다. 지금 작성 →
              </a>
            ) : (
              <a
                href="/match-form"
                style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  background: 'rgba(90,122,92,0.1)',
                  border: '1px solid var(--forest)',
                  borderRadius: 999,
                  textDecoration: 'none',
                  color: 'var(--forest-deep)',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                ✓ 매칭 폼 제출됨 · 수정/보기 →
              </a>
            )}
          </div>
        );
      })()}

      <PartnerCard
        partnerApp={partnerApp}
        round={currentRound}
        published={published}
      />

      <MissionCard mission={mission} />

      <div style={{ padding: '16px 20px 32px' }}>
        <a
          href="#"
          style={{
            display: 'block',
            padding: '14px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--sub)',
            textDecoration: 'none',
          }}
        >
          매칭 파트너와 오픈채팅하기 →
        </a>
        <p
          style={{
            fontSize: 11,
            color: 'var(--sub)',
            textAlign: 'center',
            marginTop: 10,
            lineHeight: 1.6,
          }}
        >
          {me.name}님 · {cohort.name}
          <br />
          SMS로 받은 링크를 통해 접속 중이에요.
        </p>
      </div>
    </main>
  );
}
