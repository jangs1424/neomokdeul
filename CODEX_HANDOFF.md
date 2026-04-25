# 너목들 (Neomokdeul) — Codex 인수인계 문서

> 작성일: 2026-04-24  
> 이 문서는 Claude Code → Codex 작업 이관용. 최신 코드 상태 기준.

---

## 1. 프로젝트 개요

**너목들 (너의 목소리가 들려)** — Socially 브랜드의 8일 익명 전화 소울메이트 매칭 서비스.

- 참가자가 신청 → 어드민이 승인 → Day 1에 매칭폼 작성 → AI 매칭 → 5일간 익명 전화 → 오프라인 게더링
- **관리자(어드민)**: `apps/admin` — 기수 관리, 신청 심사, 매칭 실행, SMS 발송
- **참가자 웹앱**: `apps/webapp` — 로그인, 매칭폼 작성, 미션 확인, 파트너 정보
- **랜딩**: `apps/landing` — 신청 페이지 (별도)

---

## 2. 모노레포 구조

```
neomokdeul/
├── apps/
│   ├── admin/          # Next.js 15, localhost:3001
│   ├── webapp/         # Next.js 15, localhost:3002
│   └── landing/        # Next.js 15, localhost:3000
├── packages/
│   ├── db/             # @neomokdeul/db — Supabase 클라이언트 + 타입
│   │   ├── src/
│   │   │   ├── schema.ts      ← 모든 TypeScript 인터페이스
│   │   │   ├── store.ts       ← DB 함수 (createCohort, updateCohort 등)
│   │   │   └── index.ts       ← exports
│   │   └── supabase/
│   │       └── migrations/    ← SQL 마이그레이션 (0001~0012)
│   └── ui/             # @neomokdeul/ui — 디자인 토큰 (미완성, 거의 미사용)
├── docs/
│   └── matching-heuristics.md  ← 호스트 노하우 알고리즘 단일 진실 소스
└── pnpm-workspace.yaml
```

---

## 3. 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 App Router |
| 언어 | TypeScript |
| DB | Supabase (Postgres, Sydney: `aws-1-ap-southeast-2.pooler.supabase.com`) |
| 인증 | 커스텀 HMAC 토큰 (`WEBAPP_TOKEN_SECRET`) |
| SMS | Solapi API |
| AI 매칭 | Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) |
| 패키지 매니저 | pnpm |
| 디자인 | Pretendard Variable, CSS 커스텀 프로퍼티 |

---

## 4. 환경 변수 (`.env.local` 파일에 있음)

각 앱 폴더(`apps/admin/.env.local`, `apps/webapp/.env.local`)에 존재:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_DB_HOST=aws-1-ap-southeast-2.pooler.supabase.com
SUPABASE_DB_USER=postgres.lmjjxldoxggnzcdxfuvq
SUPABASE_DB_PASSWORD=...
ANTHROPIC_API_KEY=...               # Claude Haiku 매칭용
SOLAPI_API_KEY=...
SOLAPI_API_SECRET=...
SOLAPI_SENDER_PHONE=01039911091
WEBAPP_TOKEN_SECRET=...             # HMAC 토큰 서명
```

---

## 5. 로컬 개발 서버

```bash
# 어드민 (포트 3001)
cd apps/admin && pnpm dev

# 웹앱 (포트 3002)
cd apps/webapp && pnpm dev

# 랜딩 (포트 3000)
cd apps/landing && pnpm dev
```

**테스트 토큰** (최영준, test-0924 기수, 유효기간 2026-05-04):
```
http://localhost:3002/login?t=eyJhcHBJZCI6ImUzYmExMTRlLWQ5MzctNGY3MC1hNTNkLTVlYTNmNjc5YjZmZiIsImNvaG9ydElkIjoiODhlMzc2M2QtOTUxOS00OWVmLWI0YjgtODgwMTQ4MTIwZDUwIiwiZXhwIjoxNzc3OTE3MjI0fQ.Ali7_rs2pw_A4_SlLSuLF1qx-ews5AH0_bpZovpplF8
```

---

## 6. DB 마이그레이션 현황 (0001~0012 완료)

| 파일 | 내용 |
|------|------|
| 0001_init.sql | 기본 스키마 (cohorts, applications, exclusions) |
| 0002_seed.sql | 시드 데이터 |
| 0003_add_sms_template.sql | cohorts.approved_sms_template |
| 0004_matchings.sql | matchings 테이블 |
| 0005_message_logs.sql | message_logs 테이블 |
| 0006_storage_buckets.sql | Supabase Storage 버킷 |
| 0007_match_responses.sql | match_responses 테이블 (매칭폼 답변) |
| 0008_match_form_tally.sql | match_responses 컬럼 대폭 추가 (Tally 구조) |
| 0009_slot_based_schedule.sql | 날짜×시간 슬롯 구조 |
| 0010_match_form_question_overrides.sql | cohorts에 7개 질문 프롬프트 컬럼 |
| 0011_match_q_choices.sql | cohorts에 7개 `*_choices text[]` 컬럼 ← NEW |
| 0012_openchat_help_images.sql | cohorts.kakao_openchat_help_image_urls text[] ← NEW |

**⚠️ 0011, 0012는 Supabase에 아직 미적용일 수 있음. 프로덕션 DB에 수동 실행 필요.**

---

## 7. 핵심 타입 (packages/db/src/schema.ts)

### Cohort (기수)
```typescript
interface Cohort {
  // 기본
  id, slug, name, description, status: CohortStatus
  programStartDate, programEndDate, applyOpensAt, applyClosesAt
  priceKrw, maxMale, maxFemale
  latpeedPaymentUrl, heroTitle, heroSubtitle, heroImageUrl
  specialFeatures: string[]
  approvedSmsTemplate, applyIntroText, voiceIntroHelp, photoHelp, motivationPrompt

  // 매칭폼 컨트롤 (Phase 12)
  matchFormClosesAt
  matchDay1Prompt ~ matchDay5Prompt

  // 7개 질문 프롬프트 (Phase 12 Option A)
  matchQConvStyleSelf, matchQConvWithStrangers, matchQConvAttraction
  matchQIdealImportant, matchQIdealSoulmateMust, matchQIdealRelationship, matchQIdealPartnerQ

  // 객관식 선택지 (Phase 16) — null이면 자유서술, 있으면 라디오
  matchQConvStyleSelfChoices?: string[]
  matchQConvWithStrangersChoices?: string[]
  matchQConvAttractionChoices?: string[]
  matchQIdealImportantChoices?: string[]
  matchQIdealSoulmateMustChoices?: string[]
  matchQIdealRelationshipChoices?: string[]
  matchQIdealPartnerQChoices?: string[]

  // 오픈채팅 설명 이미지 (Phase 16)
  kakaoOpenchatHelpImageUrls?: string[]
}
```

### MatchResponse (매칭폼 답변)
```typescript
interface MatchResponse {
  id, applicationId, cohortId
  nickname, muntoNickname, region, mbti
  matchGender?: 'opposite' | 'same' | 'any'
  phoneType?: 'iphone' | 'galaxy' | 'other'

  // 대화 성향 질문 (7개)
  convStyleSelf, convWithStrangers, convAttraction
  idealImportant, idealSoulmateMust, idealRelationship, idealPartnerQ

  // 데이별 답변
  day1Soulfood, day2Hobby, day3Place, day4Together, day5SecretMission

  // 슬롯 & 연락
  availableSlots: string[]   // ["YYYY-MM-DD_HH-HH", ...]
  gatheringDates: string[]
  kakaoOpenchatUrl?: string  // 남성만

  marketingAgreed: boolean
}
```

---

## 8. 주요 파일 위치

### 어드민 API 라우트
```
apps/admin/app/api/
├── cohorts/route.ts                    # POST /api/cohorts
├── cohorts/[id]/route.ts               # PATCH /api/cohorts/[id]
├── cohorts/[id]/clone/route.ts         # POST (기수 복제)
├── applications/[id]/status/route.ts   # PATCH (신청 상태)
├── applications/bulk-status/route.ts   # PATCH (일괄)
├── matching/run/route.ts               # POST (매칭 실행) ← 핵심
├── matching/publish/route.ts           # POST (매칭 발송)
├── matching/[id]/swap/route.ts         # POST (매칭 교체)
├── messages/send/route.ts              # POST (SMS 단건)
├── messages/send-bulk/route.ts         # POST (SMS 대량)
└── latpeed/webhook/route.ts            # POST (결제 웹훅)
```

### 웹앱 API 라우트
```
apps/webapp/app/api/
├── match-form/route.ts    # POST/GET 매칭폼 제출·조회
└── me/route.ts            # GET 내 정보
```

### 어드민 UI 페이지
```
apps/admin/app/
├── page.tsx                    # 대시보드
├── cohorts/
│   ├── page.tsx                # 기수 목록 + 상태 탭
│   ├── new/page.tsx            # 기수 생성
│   ├── [id]/page.tsx           # 기수 상세/편집
│   └── CohortForm.tsx          # ← 기수 폼 (대형 컴포넌트, 837줄)
├── applications/page.tsx       # 신청 관리
├── matching/page.tsx           # 매칭 실행 + 결과
├── participants/page.tsx       # 참가자 목록
└── messages/page.tsx           # 문자 발송
```

### 웹앱 UI
```
apps/webapp/app/
├── page.tsx           # 메인 (3상태: onboarding/running/ended)
├── layout.tsx
├── globals.css        # Pretendard + 디자인 토큰
├── PartnerCard.tsx    # 파트너 정보 카드
├── MissionCard.tsx    # 오늘의 미션 카드
├── DayHeader.tsx      # ⚠️ dead code — 삭제 예정
├── login/             # 토큰 검증 + 세션
├── expired/           # 만료 페이지
└── match-form/
    ├── page.tsx        # 매칭폼 페이지
    ├── MatchForm.tsx   # ← 매칭폼 메인 (1054줄)
    ├── SlotGrid.tsx    # 시간 슬롯 선택 UI
    └── ReadOnlyView.tsx
```

---

## 9. 매칭 알고리즘 (apps/admin/app/api/matching/run/route.ts)

### 핵심 흐름
1. `status='approved'` + `match_response` 존재하는 신청만 풀
2. 라운드 1 (Day 2-4), 라운드 2 (Day 5-7) 분리
3. 페어 후보 생성 → 하드필터 통과 → 휴리스틱 점수 → Claude LLM 상위 30페어 rescore → 그리디 페어링

### 하드 필터 (agesOk, genderPrefsOk, roundSlotOverlap ≥ 2)
```typescript
// 나이차 룰
function agesOk(maleApp, femaleApp, refYear): boolean {
  const diff = maleAge - femaleAge;
  if (diff > 4) return false;   // 남자 5살+ 연상 금지
  if (diff < -3) return false;  // 여자 4살+ 연상 금지
  // 20대 초반↔후반 게이팅
  if (maleAge <= 23 && femaleAge > 26) return false;
  if (femaleAge <= 23 && maleAge > 26) return false;
  return true;
}

// 남자 오픈채팅 URL 필터
if (mr.gender === 'male' && !resp.kakaoOpenchatUrl) → skip
```

### 점수 산식 (computeHeuristicScore)
```
rawScore =
  slotBase(0.35~0.45)           # 슬롯 겹침 1개=0.35, 4개+=0.45
  + keywordOverlap(≤0.15)       # 장소·활동·음악 키워드 겹침
  + foodAffinity(0.06)          # 소울푸드 카테고리 유사
  + effortMatch(0.05)           # 답변 분량/성의 매칭
  + personalityComplement(0.08) # 성격 보완형
  + ageOrientationBonus         # 남연상+0.05, 동갑-0.02, 여연상-0.08

ageOrientationBonus 우선순위:
  1순위 남연상 +0.05
  2순위 동갑  -0.02  ← 소프트 디스선호
  3순위 여연상 -0.08 ← 최대한 줄이기
```

### Claude LLM (apps/admin/lib/claude.ts)
- 모델: `claude-haiku-4-5-20251001`
- forced tool_use → `rate_pair` 도구 → `{ score: float, reasoning: string }`
- 실패 시 텍스트 파싱 폴백 → 1회 자동 재시도
- 프롬프트 캐시: `cache_control: ephemeral`

---

## 10. 매칭폼 구조 (apps/webapp/app/match-form/MatchForm.tsx)

### 폼 상태 (FormState)
```typescript
{
  nickname: string          // "7일간 사용할 비밀 닉네임"
  phoneType: '' | 'iphone' | 'galaxy' | 'other'
  // 본 질문 7개 (라디오 또는 textarea)
  convStyleSelf, convWithStrangers, convAttraction
  idealImportant, idealSoulmateMust, idealRelationship, idealPartnerQ
  // 데이별
  day1Soulfood~day5SecretMission
  // 슬롯
  availableSlots: string[]
  // 동의
  privacyAgreed: boolean    // 개인정보 (필수)
  partnerInfoAgreed: boolean // 파트너 정보공개 (필수)
  marketingAgreed: boolean   // 마케팅 (선택)
  // 남성만
  kakaoOpenchatUrl: string
}
```

### 제거된 필드 (Phase 16)
- ~~matchGender~~ → 서버에서 `'opposite'` 하드코딩
- ~~muntoNickname~~ → 없음
- ~~gatheringDates~~ → 서버에서 `[]` 하드코딩

### 주요 컴포넌트
- `MainQuestion` — `choices` 배열 있으면 라디오, 없으면 textarea
- `ConsentBlock` — 약관 본문(스크롤) + 동의 체크박스
- `SlotGrid` — 날짜×시간 슬롯 선택 UI

---

## 11. 어드민 기수 폼 (apps/admin/app/cohorts/CohortForm.tsx)

`QuestionEditor` 컴포넌트: 각 본 질문마다 `prompt` textarea + `choices` 개행 구분 textarea.
choices를 개행으로 입력 → `parseLines()` → string[] → DB에 `text[]`로 저장.

---

## 12. 디자인 토큰 (apps/webapp/app/globals.css)

```css
:root {
  --bg: #ffffff;       --bg-soft: #f7faf8;  --mint: #eaf5ee;
  --green: #1f8a5c;    --green-strong: #137048;  --green-deep: #0a4a30;
  --ink: #0d1a13;      --text: #1f2a24;     --muted: #6b7b72;
  --line: #e6ece8;     --line-strong: #cfd9d3;
  /* 레거시 호환 */
  --surface: #fff;     --border: #e6ece8;   --sub: #6b7b72; --forest: #1f8a5c;
}
/* 폰트: Pretendard Variable (CDN) */
```

---

## 13. 미완료 작업 (Pending Tasks)

### 🔴 우선순위 1 — Negative preference 폼 필드 (#38)

**목표**: "이런 분이 어려워요" 필드 추가 → 매칭 패널티 적용

**구현 단계**:

1. **마이그레이션** `0013_dislike_traits.sql`:
   ```sql
   alter table match_responses
     add column if not exists dislike_traits text;
   comment on column match_responses.dislike_traits
     is '어려운 사람·상황 서술 (오픈텍스트) — 매칭 패널티용';
   ```

2. **schema.ts** `MatchResponse` 인터페이스에 추가:
   ```typescript
   dislikeTraits?: string;
   ```

3. **store.ts** `MatchResponseInput`, `rowToMatchResponse`, `createMatchResponse`, `updateMatchResponse` 모두 `dislike_traits` 추가

4. **MatchForm.tsx** FormState에 `dislikeTraits: string` 추가, 섹션에 textarea 렌더:
   ```
   위치: 본 질문 7개 바로 뒤 (슬롯 선택 전)
   라벨: "이런 분이 조금 어려워요 (선택)"
   placeholder: "예: 말이 없고 리액션이 없는 분, 자기 얘기만 하는 분..."
   ```

5. **claude.ts** `formatPairForPrompt` 함수에 추가:
   ```typescript
   부적합 신호: ${r.dislikeTraits ?? ""}
   ```
   SYSTEM_PROMPT 감산 신호 섹션에 룰 추가:
   ```
   3. **부적합 신호 충돌**: A의 "이런 분 어려움" 답변 내용이 B의 답변 톤/내용과 직접 충돌하면 -0.3. 양방향 체크 (A→B, B→A 둘 다).
   ```

6. **match-form/api route** (`apps/webapp/app/api/match-form/route.ts`): `dislikeTraits` 필드 저장 추가

---

### 🟡 우선순위 2 — Vercel 배포

```
프로젝트 2개 생성:
  neomokdeul-admin   (apps/admin)
  neomokdeul-webapp  (apps/webapp)

환경변수: 위 섹션 6 전부 등록
루트 디렉토리: apps/admin (또는 apps/webapp)
빌드 명령: pnpm build
```

---

### 🟢 소규모 정리

- `apps/webapp/app/DayHeader.tsx` — dead code, 삭제
- `apps/webapp/tailwind.config.ts` — serif font 설정 잔재 정리
- 동의 약관 텍스트 — 호스트가 직접 검토·수정 필요 (현재 표준 약관 문구)
- 오픈채팅 설명 이미지 — Supabase Storage 업로드 후 URL을 어드민 기수 폼에 입력

---

## 14. 완료된 주요 작업 이력

| Phase | 내용 |
|-------|------|
| 1-6 | 어드민 UI (대시보드, 신청관리, 기수관리, 문자발송, 매칭, 참가자) |
| 7-8 | 음성·사진 Supabase Storage 업로드 |
| 9 | 참가자 웹앱 MVP (토큰 인증, 파트너 카드, 미션) |
| 10 | 20명 시뮬레이션 플로우 테스트 |
| 11 | 매칭 폼 + 알고리즘 재설계 |
| 12 | 날짜별 슬롯 + 7개 본질문 |
| 13 | Claude LLM 신뢰도 개선 (tool_use + 재시도 + 캐시) |
| 14 | 호스트 휴리스틱 주입 (인터뷰 Q1-Q5 반영) |
| 15-16 | 나이차 필터 + 방향 우선순위 + 내용기반 시그널 |
| 16-B | 객관식 선택지, 동의 약관, 오픈채팅 이미지, 닉네임 명명 |

---

## 15. 자주 쓰는 명령

```bash
# 타입체크
pnpm -F @neomokdeul/db tsc --noEmit
pnpm -F admin tsc --noEmit
pnpm -F webapp tsc --noEmit

# DB 패키지 빌드 (코드 변경 후)
pnpm -F @neomokdeul/db build

# 전체 타입체크
pnpm tsc --noEmit  # 각 앱 폴더에서
```
