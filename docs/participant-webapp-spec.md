# 참가자 웹앱 (apps/webapp) 스펙 — Phase 9

**타겟 사용자:** 승인·결제 완료한 참가자 (약 30명/기수)  
**진입:** 매칭 공개/미션 SMS 링크 → 클릭 → 로그인(세션) → 메인 화면  
**포트:** 3002  
**톤:** 감성적, 모바일 퍼스트. 크림 계열 배경 + 포레스트 그린 액센트 (원래 랜딩 톤에 맞춤)

---

## 0. MVP 범위 (이번에 만들 것)

- [x] Magic-link 로그인 (SMS 링크 → 토큰 검증 → 세션 쿠키)
- [x] `/` 메인: 오늘의 미션 + 파트너 카드 + 힌트 버튼 + D-카운터
- [x] 8일 기본 미션 하드코딩 (DB에서 오버라이드 가능하면 더 좋음, 아니면 상수)
- [x] Day 1~4 = 1차 파트너, Day 5~7 = 2차 파트너 표시
- [x] 모바일 반응형

### 이번에 안 할 것 (다음 Phase)
- Day 8 최종 매칭 투표
- 파트너 프로필 상세 페이지
- 실시간 업데이트 (폴링 or WebSocket)
- 관리자가 미션 커스텀

---

## 1. 아키텍처

### 1.1 로그인 (magic link)

**흐름:**
1. 어드민이 `/messages`에서 매칭 공개 SMS 발송 시, URL에 서명된 토큰 포함:
   `https://<webapp>/login?t=<signed-token>`
2. 참가자 클릭 → 서버에서 토큰 검증 → 세션 쿠키 발급 → `/` 리다이렉트

**토큰 포맷 (HMAC-signed, 무DB):**
```
base64url({
  appId: <application-uuid>,
  cohortId: <cohort-uuid>,
  exp: <unix-seconds>  // 8일 프로그램 끝 + 3일 (버퍼)
})
+ "." +
base64url(HMAC-SHA256(payload, WEBAPP_TOKEN_SECRET))
```

- `WEBAPP_TOKEN_SECRET` = env 변수, 64자 랜덤 문자열 (새로 생성)
- 토큰은 URL-safe

**세션 쿠키:**
- name: `socially_session`
- httpOnly: true, secure: true, sameSite: 'lax'
- value: 토큰 그대로 (재검증 매 요청마다)
- maxAge: 12 days (프로그램 + 버퍼)

### 1.2 세션 미들웨어

`apps/webapp/middleware.ts`:
- 모든 요청에 세션 체크
- 세션 없으면 `/login?t=...` 이 아닌 한 `/expired`로 리다이렉트
- 세션 있으면 `request.headers`에 `x-app-id`, `x-cohort-id` 주입

### 1.3 데이터 레이어

- `@neomokdeul/db` 재사용 (server-side만)
- 필요한 쿼리:
  - `getApplicationById(appId)` — 기존 export
  - `getCohort(cohortId)` — 기존 export
  - `listMatchings(cohortId)` — 기존 export (참가자에게 배정된 매칭 찾기)
  - 새로: `getMatchingForApplication(appId, round)` — helper 추가 필요

### 1.4 미션 데이터

MVP: `apps/webapp/lib/missions.ts`에 하드코딩 (배열 8개 x 2라운드 = 총 8일):

```ts
export const MISSIONS = [
  { day: 1, title: "첫 인사", prompt: "자기 소개 1분 통화해보기...", hint: "..." },
  { day: 2, title: "취향 공유", prompt: "..." },
  ...
  { day: 8, title: "최종 선택", prompt: "..." },
];
```

---

## 2. 페이지별 사양

### `/login`
- Server component
- Query param `t` 확인 → 검증
- 유효: 세션 쿠키 set + `/` 리다이렉트
- 무효: "링크가 만료되었거나 유효하지 않습니다. 호스트에게 문의해주세요." 페이지

### `/` (메인)
- 세션에서 appId, cohortId 가져와 server-fetch:
  - 오늘 날짜 (KST)
  - 프로그램 Day N 계산 (cohort.program_start_date 기준)
  - 현재 라운드: Day 1~4 = 1차, Day 5~7 = 2차, Day 8 = 최종
  - 해당 라운드의 매칭 (published 상태만) + 파트너 application 정보
  - 오늘의 미션
- 레이아웃 (모바일 세로, max-width 480px):
  - 상단: Socially 로고 + "Day N / 8" 표시 + D-counter "D-M까지"
  - 파트너 카드:
    - 공개 전(매칭 아직 안 public): "곧 공개될 예정이에요" 안내
    - 공개 후: 파트너 닉네임(또는 익명 이름) + 성별 + 년생 + 지역 + MBTI + 한 줄 자기소개
  - 미션 카드:
    - 오늘의 미션 타이틀
    - 프롬프트 전문
    - "힌트 열기" 버튼 (client — 클릭 시 hint 텍스트 토글)
  - 하단: "매칭 파트너와 오픈채팅하기" 버튼 (현재 미구현 — `#` 링크)

### `/expired`
- "세션 만료. SMS로 받은 최신 링크를 다시 눌러주세요."

### `/mission/[day]` (옵션, 여력 있으면)
- 이전 Day 미션 아카이브 보기

---

## 3. 디자인 토큰

랜딩과 같은 톤 (크림+포레스트):
```
--bg: #fbfaf6 (밝은 크림)
--surface: #ffffff
--border: #e8e3d6
--ink: #2f3630
--sub: #6b726d
--forest: #5a7a5c
--accent: #d67a63 (코랄, 파트너 카드용)
```

폰트:
- 헤더: `var(--font-serif)` (Nanum Myeongjo) — 1~2곳만 포인트
- 본문: `var(--font-sans)` (IBM Plex Sans KR) — 대부분

---

## 4. 구현 순서 (에이전트 병렬)

**Agent A (opus) — 인증 + 세션**
- `apps/webapp/lib/token.ts` — HMAC 검증
- `apps/webapp/middleware.ts` — 세션 체크
- `apps/webapp/app/login/page.tsx`
- `apps/webapp/app/expired/page.tsx`
- WEBAPP_TOKEN_SECRET 환경변수 .env.local에 추가

**Agent B (sonnet) — 메인 페이지**
- `apps/webapp/app/page.tsx`
- `apps/webapp/app/PartnerCard.tsx`
- `apps/webapp/app/MissionCard.tsx` (client, 힌트 토글)
- `apps/webapp/app/DayHeader.tsx`
- `apps/webapp/lib/missions.ts` (8일 미션 하드코딩)
- `apps/webapp/lib/program.ts` (날짜 → Day N + round 계산)

**Agent C (sonnet) — 레이아웃 + 전역**
- `apps/webapp/app/layout.tsx` (폰트, 전역 스타일)
- `apps/webapp/app/globals.css` (크림+포레스트 토큰, 모바일 리셋)
- `apps/webapp/package.json` (deps: `@neomokdeul/db`, transpilePackages)
- `apps/webapp/next.config.ts`

**내가 직접:**
- DB 헬퍼 추가 `getMatchingForApplication` (packages/db/src/store.ts)
- Env var 세팅
- 통합 테스트용 토큰 생성 스크립트 (`packages/db/scripts/make-test-token.mjs`)
- 커밋 + 푸시

---

## 5. 테스트 시나리오

1. 테스트 토큰 생성 (박지민 application id)
2. `http://localhost:3002/login?t=<token>` 접속 → `/` 리다이렉트
3. 매칭 없으면: "곧 공개" 문구
4. `/matching` 어드민에서 매칭 publish → 웹앱 새로고침 → 파트너 카드 뜸
5. 힌트 버튼 → 힌트 토글
6. 세션 쿠키 확인
7. 만료된 토큰으로 접속 → `/expired`

---

## 6. 완료 조건
- typecheck 3개 모두 pass
- `curl -sI http://localhost:3002/login?t=<test>` → 307 리다이렉트 또는 200
- 브라우저로 네 핸드폰에서 모바일 뷰 확인
- git commit + push

---

## 7. 실패 대응
- 어떤 에이전트라도 실패 시:
  - 실패 로그 git commit 메시지에 기록
  - 다음 에이전트는 계속 진행
  - 유저가 일어났을 때 실패 지점만 고치게끔
- 작업 끝나고 `docs/phase-9-report.md` 에 결과 요약 (성공/실패/이슈)

---

**참조:**
- 기존 스펙: `C:\Users\jangs\.claude\projects\C--Users-jangs-Downloads-------------\memory\project_neomokdeul_v2_spec.md`
- 메모리 전체: `C:\Users\jangs\.claude\projects\C--Users-jangs-Downloads-------------\memory\MEMORY.md`
- DB 스키마: `packages/db/src/schema.ts`
- 기존 코드: `apps/webapp/` (Day 3 placeholder만 있음, 전체 다시 작성)
