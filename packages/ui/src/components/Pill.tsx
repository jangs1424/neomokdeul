import React from 'react';
import { colors, radii } from '../tokens';

export type PillTone = 'forest' | 'yellow' | 'coral' | 'neutral';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  children: React.ReactNode;
}

const toneStyles: Record<PillTone, React.CSSProperties> = {
  forest: {
    background: colors.forest,
    color: colors.cream,
    border: `1px solid ${colors.forestDark}`,
  },
  yellow: {
    background: colors.yellow,
    color: colors.forestDeep,
    border: `1px solid ${colors.forestDeep}`,
  },
  coral: {
    background: colors.coral,
    color: '#ffffff',
    border: `1px solid #c94336`,
  },
  neutral: {
    background: colors.creamDeep,
    color: colors.ink,
    border: `1px solid ${colors.line}`,
  },
};

export function Pill({ tone = 'neutral', children, style, ...rest }: PillProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: radii.pill,
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        lineHeight: 1,
        ...toneStyles[tone],
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
