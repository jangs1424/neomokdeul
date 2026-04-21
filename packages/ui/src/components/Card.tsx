import React from 'react';
import { colors, radii, spacing } from '../tokens';

export type CardVariant = 'paper' | 'sticker' | 'dark';
export type CardPadding = 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  children: React.ReactNode;
}

const paddingMap: Record<CardPadding, string> = {
  sm: `${spacing.md}px`,
  md: `${spacing.lg}px`,
  lg: `${spacing['2xl']}px`,
};

const variantBase: Record<CardVariant, React.CSSProperties> = {
  paper: {
    background: '#ffffff',
    border: `1px solid ${colors.line}`,
    boxShadow: '0 2px 12px rgba(26,77,46,0.07)',
    borderRadius: radii.md,
    color: colors.ink,
  },
  sticker: {
    background: colors.cream,
    border: `2px solid ${colors.forest}`,
    boxShadow: `4px 4px 0 ${colors.forest}`,
    borderRadius: radii.md,
    color: colors.ink,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  dark: {
    background: colors.forest,
    border: `1px solid ${colors.forestDark}`,
    borderRadius: radii.lg,
    color: colors.cream,
  },
};

export function Card({
  variant = 'paper',
  padding = 'md',
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: CardProps) {
  const [hovered, setHovered] = React.useState(false);

  const hoverStyle: React.CSSProperties =
    variant === 'sticker' && hovered
      ? { transform: 'translate(-2px, -2px)', boxShadow: `6px 6px 0 ${colors.forest}` }
      : {};

  return (
    <div
      style={{
        ...variantBase[variant],
        padding: paddingMap[padding],
        ...hoverStyle,
        ...style,
      }}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e); }}
      {...rest}
    >
      {children}
    </div>
  );
}
