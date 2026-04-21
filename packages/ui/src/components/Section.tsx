import React from 'react';

export type SectionPadding = 'sm' | 'md' | 'lg';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  padding?: SectionPadding;
  narrow?: boolean;
  children: React.ReactNode;
}

const verticalPadding: Record<SectionPadding, string> = {
  sm: '64px',
  md: '96px',
  lg: '140px',
};

export function Section({ padding = 'md', narrow = false, children, style, ...rest }: SectionProps) {
  return (
    <section
      style={{
        position: 'relative',
        padding: `${verticalPadding[padding]} 0`,
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          maxWidth: narrow ? '920px' : '1280px',
          margin: '0 auto',
          padding: '0 40px',
        }}
      >
        {children}
      </div>
    </section>
  );
}
