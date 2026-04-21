import { computeProgramDay } from '../lib/program';
import type { Cohort } from '@neomokdeul/db';

export function DayHeader({ cohort }: { cohort: Cohort }) {
  const p = computeProgramDay(cohort.programStartDate, cohort.programEndDate);

  const dayLabel = p.isBeforeStart
    ? '시작 전'
    : p.isAfterEnd
      ? '종료'
      : `Day ${p.day} / 8`;

  const dCounter = p.isBeforeStart
    ? `D-${p.daysUntilStart} 시작`
    : p.isAfterEnd
      ? '프로그램 종료'
      : `D-${Math.max(0, p.daysUntilEnd)} 마무리`;

  return (
    <header
      style={{
        padding: '24px 20px 16px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--forest)',
          letterSpacing: '-.01em',
        }}
      >
        Socially
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--sub)',
          marginTop: 2,
          letterSpacing: '.02em',
        }}
      >
        너의 목소리가 들려 · {cohort.name}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 18,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-.02em',
          }}
        >
          {dayLabel}
        </div>
        <div style={{ fontSize: 13, color: 'var(--sub)' }}>{dCounter}</div>
      </div>
    </header>
  );
}
