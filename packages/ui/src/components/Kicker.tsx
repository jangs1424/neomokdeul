import React from 'react';
import { colors } from '../tokens';

export interface KickerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Kicker({ children, style, ...rest }: KickerProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '12px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: colors.forest,
        fontWeight: 600,
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          display: 'inline-block',
          width: '24px',
          height: '1px',
          background: colors.forest,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
