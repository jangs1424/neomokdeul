# @neomokdeul/ui

Shared design-system package for the `neomokdeul` monorepo (Socially · 너의 목소리가 들려).

Design language: cream `#f5efd8` + forest green `#1a4d2e` + yellow CTA `#f4c430` + coral `#e85d4d` + handwritten accents.

## Usage in consumer apps

**1. Add workspace dependency** in `apps/landing/package.json` (or `admin`, `webapp`):
```json
"dependencies": {
  "@neomokdeul/ui": "workspace:*"
}
```

**2. Import global styles** once in your root layout (`app/layout.tsx`):
```ts
import '@neomokdeul/ui/styles/globals.css';
```

**3. Register fonts** via `next/font` and inject CSS variables into `<html>`:
```tsx
import { Nanum_Myeongjo, IBM_Plex_Sans_KR, Gaegu, Caveat } from 'next/font/google';
// ... configure fonts, then pass className to <html> with var(--font-serif) etc.
```

**4. Use components and tokens**:
```tsx
import { Button, Card, Heading, Text, Handwritten, Pill, Section, Kicker, colors } from '@neomokdeul/ui';

<Section padding="lg">
  <Kicker>Brand Essence</Kicker>
  <Heading level={2}>너의 목소리가 들려</Heading>
  <Button variant="primary">신청하기 →</Button>
</Section>
```
