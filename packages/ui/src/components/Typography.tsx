import React from 'react';
import { colors, fonts } from '../tokens';

/* ─── Heading ───────────────────────────────────────────── */
export type HeadingLevel = 1 | 2 | 3 | 4;

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  children: React.ReactNode;
}

const headingSizes: Record<HeadingLevel, string> = {
  1: 'clamp(48px, 8vw, 104px)',
  2: 'clamp(40px, 5.5vw, 72px)',
  3: '28px',
  4: '22px',
};

export function Heading({ level = 2, children, style, ...rest }: HeadingProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4';
  return (
    <Tag
      style={{
        fontFamily: fonts.serif,
        fontWeight: 800,
        fontSize: headingSizes[level],
        color: colors.forest,
        lineHeight: 1.05,
        letterSpacing: '-0.03em',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ─── Text ───────────────────────────────────────────────── */
export type TextSize = 'sm' | 'base' | 'lg';
export type TextColor = 'ink' | 'sub' | 'forest';

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: TextSize;
  color?: TextColor;
  children: React.ReactNode;
}

const textSizes: Record<TextSize, string> = {
  sm: '13px',
  base: '15px',
  lg: '18px',
};

const textColors: Record<TextColor, string> = {
  ink: colors.ink,
  sub: colors.sub,
  forest: colors.forest,
};

export function Text({ size = 'base', color = 'ink', children, style, ...rest }: TextProps) {
  return (
    <p
      style={{
        fontFamily: fonts.sans,
        fontSize: textSizes[size],
        color: textColors[color],
        lineHeight: 1.8,
        ...style,
      }}
      {...rest}
    >
      {children}
    </p>
  );
}

/* ─── Handwritten ────────────────────────────────────────── */
export type HandLang = 'kr' | 'en';

export interface HandwrittenProps extends React.HTMLAttributes<HTMLSpanElement> {
  lang?: HandLang;
  tilt?: number;
  children: React.ReactNode;
}

export function Handwritten({ lang = 'en', tilt, children, style, ...rest }: HandwrittenProps) {
  const fontFamily = lang === 'kr' ? fonts.handKr : fonts.handEn;
  const transform = tilt !== undefined ? `rotate(${tilt}deg)` : undefined;

  return (
    <span
      style={{
        fontFamily,
        display: 'inline-block',
        transform,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
