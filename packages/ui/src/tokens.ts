export const colors = {
  cream: '#f5efd8',
  cream2: '#faf5e4',
  creamDeep: '#ece4c7',
  forest: '#1a4d2e',
  forestDark: '#0f3821',
  forestDeep: '#08301b',
  yellow: '#f4c430',
  yellowBright: '#ffd93d',
  coral: '#e85d4d',
  ink: '#1a1a1a',
  sub: '#5a5a5a',
  line: '#d9cfa9',
} as const;

export const fonts = {
  serif: 'var(--font-serif, "Nanum Myeongjo", serif)',
  sans: 'var(--font-sans, "IBM Plex Sans KR", sans-serif)',
  handKr: 'var(--font-hand-kr, "Gaegu", cursive)',
  handEn: 'var(--font-hand-en, "Caveat", cursive)',
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  '2xl': 64,
  '3xl': 96,
} as const;
