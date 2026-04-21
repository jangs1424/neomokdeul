"use client";

import { useState } from 'react';
import type { Mission } from '../lib/missions';

export function MissionCard({ mission }: { mission: Mission }) {
  const [showHint, setShowHint] = useState(false);

  return (
    <section
      style={{
        padding: '20px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        margin: '20px 16px',
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
        DAY {mission.day} 미션
      </div>
      <h2
        style={{
          fontSize: 19,
          fontWeight: 700,
          color: 'var(--ink)',
          marginTop: 8,
          letterSpacing: '-.01em',
          lineHeight: 1.4,
        }}
      >
        {mission.title}
      </h2>
      <p
        style={{
          fontSize: 15,
          color: 'var(--ink)',
          lineHeight: 1.8,
          marginTop: 12,
          whiteSpace: 'pre-line',
        }}
      >
        {mission.prompt}
      </p>
      <button
        onClick={() => setShowHint((v) => !v)}
        style={{
          marginTop: 16,
          padding: '10px 16px',
          background: showHint ? 'var(--surface)' : 'var(--forest)',
          color: showHint ? 'var(--forest)' : '#fff',
          border: '1px solid var(--forest)',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {showHint ? '힌트 닫기' : '힌트 열기'}
      </button>
      {showHint && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            background: 'var(--bg)',
            borderRadius: 10,
            fontSize: 13.5,
            color: 'var(--sub)',
            lineHeight: 1.7,
          }}
        >
          💡 {mission.hint}
        </div>
      )}
    </section>
  );
}
