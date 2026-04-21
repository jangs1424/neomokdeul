import React from 'react';
import { colors, fonts, radii } from '../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '8px 16px', fontSize: '12px' },
  md: { padding: '11px 22px', fontSize: '14px' },
  lg: { padding: '16px 28px', fontSize: '16px' },
};

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: fonts.sans,
  fontWeight: 700,
  borderRadius: radii.pill,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  cursor: 'pointer',
  transition: 'transform 0.15s, box-shadow 0.15s, background 0.2s',
  border: 'none',
  textDecoration: 'none',
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: colors.yellow,
    color: colors.forestDeep,
    border: `2px solid ${colors.forestDeep}`,
    boxShadow: `3px 3px 0 ${colors.forestDeep}`,
  },
  secondary: {
    background: colors.forest,
    color: colors.cream,
    border: `2px solid ${colors.forestDeep}`,
  },
  ghost: {
    background: 'transparent',
    color: colors.forest,
    border: 'none',
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
    letterSpacing: 'normal',
    textTransform: 'none',
    fontWeight: 600,
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...rest
}: ButtonProps) {
  const [hovered, setHovered] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const hoverStyle: React.CSSProperties =
    variant === 'primary' && hovered
      ? { transform: 'translate(-2px, -2px)', boxShadow: `5px 5px 0 ${colors.forestDeep}` }
      : variant === 'primary' && active
      ? { transform: 'translate(1px, 1px)', boxShadow: `1px 1px 0 ${colors.forestDeep}` }
      : variant === 'secondary' && hovered
      ? { background: colors.forestDark }
      : {};

  return (
    <button
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...hoverStyle,
        ...style,
      }}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); setActive(false); onMouseLeave?.(e); }}
      onMouseDown={(e) => { setActive(true); onMouseDown?.(e); }}
      onMouseUp={(e) => { setActive(false); onMouseUp?.(e); }}
      {...rest}
    >
      {children}
    </button>
  );
}
