import type { Application } from '@neomokdeul/db';

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
          margin: '16px 20px 0',
          padding: '18px 20px',
          background: 'var(--bg-soft)',
          border: '1px solid var(--line)',
          borderRadius: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            fontWeight: 700,
          }}
        >
          {roundLabel}
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--ink)',
            marginTop: 8,
            letterSpacing: '-0.02em',
          }}
        >
          곧 공개될 예정이에요
        </div>
        <p
          style={{
            fontSize: 13.5,
            color: 'var(--muted)',
            marginTop: 6,
            lineHeight: 1.7,
          }}
        >
          아직 매칭이 공개되지 않았어요. 공개되면 SMS로 알려드릴게요.
        </p>
      </section>
    );
  }

  const motivationPreview =
    partnerApp.motivation.length > 60
      ? partnerApp.motivation.slice(0, 60) + '…'
      : partnerApp.motivation;

  return (
    <section
      style={{
        margin: '16px 20px 0',
        padding: '20px 22px',
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: 16,
        boxShadow: '0 10px 30px -18px rgba(10,74,48,0.18)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--green)',
          }}
        />
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--green-strong)',
            fontWeight: 700,
          }}
        >
          {roundLabel}
        </span>
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: 'var(--ink)',
          marginTop: 10,
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
        }}
      >
        {partnerApp.name}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px 8px',
          marginTop: 12,
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
                color: 'var(--text)',
                background: 'var(--mint)',
                borderRadius: 999,
                padding: '4px 10px',
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
      </div>

      <p
        style={{
          fontSize: 14,
          color: 'var(--text)',
          marginTop: 14,
          lineHeight: 1.7,
          padding: '12px 14px',
          background: 'var(--bg-soft)',
          borderRadius: 10,
          borderLeft: '3px solid var(--green)',
        }}
      >
        "{motivationPreview}"
      </p>
    </section>
  );
}
