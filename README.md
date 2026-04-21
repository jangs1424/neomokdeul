# 너목들 (neomokdeul)

**너의 목소리가 들려** — Socially 브랜드의 8일간 익명 전화 소울메이트 매칭 서비스.

## Monorepo 구조

```
neomokdeul/
├── apps/
│   ├── landing/    # 랜딩 + 신청 폼 (대외)
│   ├── admin/      # 호스트 어드민 (매칭·심사·블랙리스트)
│   └── webapp/     # 참가자 8일 여정 웹앱
└── packages/
    ├── ui/         # 공유 디자인 컴포넌트
    ├── db/         # Supabase 스키마 + 타입
    └── config/     # 공유 설정 (tsconfig, eslint 등)
```

## 스택

- **Framework**: Next.js 15 (App Router)
- **DB/Auth**: Supabase
- **Hosting**: Vercel
- **Payments**: Latpeed
- **SMS**: Solapi
- **AI 매칭**: Anthropic Claude API
- **Package manager**: pnpm workspaces

## 개발

```bash
pnpm install                 # 전체 설치
pnpm dev:landing             # 랜딩만 띄우기
pnpm dev:admin               # 어드민만
pnpm dev:webapp              # 참가자 웹앱만
```
