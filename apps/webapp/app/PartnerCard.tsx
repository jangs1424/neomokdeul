import type { Application } from '@neomokdeul/db';
import type { Round } from '../lib/program';

interface Props {
  partnerApp: Application | null;
  round: 1 | 2;
  published: boolean;
}

const ROUND_LABEL: Record<1 | 2, string> = {
  1: '1차 파트너',
  2: '2차 파트너',
};

const GENDER_LABEL: Record<string, string> = {
  male: '남성',
  female: '여성',
};

export function PartnerCard({ partnerApp, round, published }: Props) {
  const roundLabel = ROUND_LABEL[round];

  if (!published || !partnerApp) {
    return (
      <section
        style={{
          margin: '20px 16px',
          padding: '20px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--border)',
          borderRadius: 14,
          opacity: 0.7,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: 'var(--sub)',
            fontWeight: 600,
          }}
        >
          {roundLabel}
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--ink)',
            marginTop: 10,
            letterSpacing: '-.01em',
          }}
        >
          곧 공개될 예정이에요
        </div>
        <p
          style={{
            fontSize: 13.5,
            color: 'var(--sub)',
            marginTop: 6,
            lineHeight: 1.7,
          }}
        >
          아직 매칭이 공개되지 않았어요. 공개되면 SMS로 알려드릴게요.
        </p>
      </section>
    );
  }

  // Truncate motivation to ~40 chars for one-liner display
  const motivationPreview =
    partnerApp.motivation.length > 42
      ? partnerApp.motivation.slice(0, 42) + '…'
      : partnerApp.motivation;

  return (
    <section
      style={{
        margin: '20px 16px',
        padding: '20px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: 'var(--forest)',
          fontWeight: 600,
        }}
      >
        {roundLabel}
      </div>
      <div
        style={{
          fontSize: 21,
          fontWeight: 700,
          color: 'var(--ink)',
          marginTop: 10,
          fontFamily: 'var(--font-serif)',
          letterSpacing: '-.01em',
        }}
      >
        {partnerApp.name}
      </div>

      {/* Meta row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px 12px',
          marginTop: 10,
        }}
      >
        {[
          `${partnerApp.birthYear}년생`,
          GENDER_LABEL[partnerApp.gender] ?? partnerApp.gender,
          partnerApp.region,
          partnerApp.mbti ?? null,
        ]
          .filter(Boolean)
          .map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 12,
                color: 'var(--sub)',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 999,
                padding: '3px 10px',
              }}
            >
              {tag}
            </span>
          ))}
      </div>

      {/* One-line motivation */}
      <p
        style={{
          fontSize: 13.5,
          color: 'var(--sub)',
          marginTop: 12,
          lineHeight: 1.7,
          fontStyle: 'italic',
        }}
      >
        "{motivationPreview}"
      </p>
    </section>
  );
}
