"use client";

import { useState } from 'react';
import type { Mission } from '../lib/missions';

export function MissionCard({ mission }: { mission: Mission }) {
  const [showHint, setShowHint] = useState(false);

  return (
    <section
      style={{
        margin: '16px 20px 0',
        padding: '20px 22px',
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: 16,
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
            width: 28,
            height: 28,
            borderRadius: 9,
            background: 'var(--mint)',
            color: 'var(--green-strong)',
            fontSize: 12,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          {mission.day}
        </span>
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--green-strong)',
            fontWeight: 700,
          }}
        >
          DAY {mission.day} · 미션
        </span>
      </div>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--ink)',
          marginTop: 10,
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
        }}
      >
        {mission.title}
      </h2>
      <p
        style={{
          fontSize: 14.5,
          color: 'var(--text)',
          lineHeight: 1.75,
          marginTop: 10,
          whiteSpace: 'pre-line',
        }}
      >
        {mission.prompt}
      </p>
      <button
        onClick={() => setShowHint((v) => !v)}
        style={{
          marginTop: 14,
          padding: '9px 16px',
          background: showHint ? '#fff' : 'var(--green)',
          color: showHint ? 'var(--green-strong)' : '#fff',
          border: `1px solid ${showHint ? 'var(--line-strong)' : 'var(--green)'}`,
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {showHint ? '힌트 닫기' : '힌트 보기'}
      </button>
      {showHint && (
        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            background: 'var(--bg-soft)',
            borderRadius: 10,
            fontSize: 13.5,
            color: 'var(--text)',
            lineHeight: 1.7,
            border: '1px solid var(--line)',
          }}
        >
          💡 {mission.hint}
        </div>
      )}
    </section>
  );
}
