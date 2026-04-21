# Phase 9 — 참가자 웹앱 MVP · 오토파일럿 리포트

**실행:** 2026-04-22 05:47 (cron id `0bf17f45`)
**결과:** ✅ 성공
**유저:** 수면 중

---

## ✅ 완료 요약

Magic-link 로그인 + 오늘의 미션 + 매칭 파트너 카드 + D-카운터가 있는 모바일 웹앱 완성.
`http://localhost:3002` 에서 작동 중.

**바로 테스트할 수 있는 링크 (네 핸드폰 브라우저로 열기 OK):**
```
http://localhost:3002/login?t=eyJhcHBJZCI6IjE5NWE2ODhkLTY5MGYtNDcwNy1iMDAzLWEzYzY3NWZkNzVkMCIsImNvaG9ydElkIjoiM2M5YzA5NzYtMzA4My00OTExLTkyYjItMmI1Njc0ODI2NTlhIiwiZXhwIjoxNzc3ODQxNjI0fQ.AZCl8CwaXadnUNWkATcypOmvQPG8P9gjQmofgAXqL2w
```
테스트 신청건: **이서현 (may-2026 기수)** · 토큰 12일 유효 (2026-05-03까지)

---

## 만든 파일들

**인증 (Agent A · opus):**
- `apps/webapp/lib/token.ts` — HMAC sign/verify
- `apps/webapp/middleware.ts` — edge 쿠키 존재 체크만 (HMAC 검증은 page 쪽)
- `apps/webapp/app/login/route.ts` — GET → 검증 → 쿠키 set → `/` redirect
  - *(초기엔 page.tsx로 만들었으나 Next.js 15의 "Server Component에서 cookies 수정 불가" 제약 때문에 Route Handler로 교체)*
- `apps/webapp/app/expired/page.tsx` — "세션 만료" 안내

**메인 페이지 (Agent B · sonnet):**
- `apps/webapp/app/page.tsx` — 세션 검증 → 데이터 페치 → 컴포넌트 조합
- `apps/webapp/app/DayHeader.tsx` — Socially 로고 + Day N/8 + D-카운터
- `apps/webapp/app/PartnerCard.tsx` — 파트너 정보 또는 "곧 공개" 상태
- `apps/webapp/app/MissionCard.tsx` — 오늘의 미션 + 힌트 토글 (client)
- `apps/webapp/lib/missions.ts` — 8일 미션 하드코딩 (1차 Day1~4, 2차 Day5~7, 최종 Day8)
- `apps/webapp/lib/program.ts` — KST 기준 Day/Round/D-카운터 계산

**레이아웃·의존성 (Agent C · sonnet):**
- `apps/webapp/app/layout.tsx` — Nanum Myeongjo + IBM Plex Sans KR, 모바일 viewport 고정
- `apps/webapp/app/globals.css` — 크림+포레스트 토큰, 모바일 리셋, iOS tap highlight 제거
- `apps/webapp/package.json` — `@neomokdeul/db`, `@neomokdeul/ui` workspace deps
- `apps/webapp/next.config.ts` — `transpilePackages`

**테스트 유틸:**
- `packages/db/scripts/make-test-token.mjs` — HMAC 서명된 토큰 생성 스크립트
  - `node packages/db/scripts/make-test-token.mjs --pick` → 승인된 신청 하나 골라 URL 생성
  - `node packages/db/scripts/make-test-token.mjs <appId>` → 특정 ID로 생성

---

## 검증 결과

| 체크 | 결과 |
|---|---|
| `pnpm -r typecheck` (landing + admin + webapp + ui) | ✅ 모두 통과 |
| `curl /login?t=<token>` | ✅ 307 + `socially_session` 쿠키 set |
| `curl -b cookies / ` | ✅ 200 + HTML에 "이서현"·"Socially"·"파트너"·"미션"·"첫 인사" 포함 |
| `curl /expired` | ✅ 200 |
| 매칭 미공개 상태 표시 | ✅ "곧 공개" 메시지 렌더 확인 |

---

## 🔴 블로커 없음

막판에 Next.js 15 Server Component cookies 제약 하나 걸렸는데 Route Handler로 전환해서 해결. 이 외 이슈 없음.

---

## 📋 TODO (다음 Phase)

**중요도 🔴:**
- **Day 8 최종 매칭 투표 폼** — 현재 메인 페이지엔 투표 UI 없음. 최종 매칭 날 서로 "예/아니오" 선택 → 서버에 저장 → 어드민이 결과 기반 연락처 교환
- **매칭 SMS에 토큰 링크 자동 포함** — 어드민 `/messages` 의 템플릿 변수 `{{webapp_url}}` 추가 + 발송 시 application별 토큰 생성. 현재는 수동으로 `make-test-token.mjs` 실행해야 링크 나옴.

**중요도 🟡:**
- **오픈채팅 링크 실제 연결** — `PartnerCard` 의 "매칭 파트너와 오픈채팅하기" 버튼이 현재 `#`. cohort 또는 matching 테이블에 `kakao_openchat_url` 컬럼 추가 필요?
- **미션 아카이브** (`/mission/[day]`) — 이전 Day 미션 다시 보기. 스펙엔 "여력 있으면"으로 후순위였음.

**중요도 🟢:**
- **매칭 공개 전 안내 문구 개선** — 현재 "곧 공개될 예정이에요" 한 줄. Day N/상황에 따라 다른 메시지 (e.g. "매일 오후 6시 공개") 노출하면 좋음.
- **힌트 토글 애니메이션** — 현재 즉시 show/hide. 부드럽게 transition 추가.

---

## 🧪 수동 검증용 시나리오

1. **모바일 브라우저**에서 위 테스트 URL 열기 (또는 PC 크롬 devtools 모바일 뷰)
2. 자동으로 `/` 리다이렉트되며 쿠키 심어짐
3. 화면에 보여야 하는 것:
   - 상단: "Socially · 너의 목소리가 들려 · 2026년 5월 기수" + 큰 "Day N/8" 또는 "시작 전" + D-카운터
   - 중간: 파트너 카드 — "곧 공개될 예정이에요" (매칭이 아직 publish 안 됐으므로)
   - 아래: DAY 1 미션 "첫 인사" + 프롬프트 + [힌트 열기] 버튼
   - 하단: 오픈채팅 버튼 + "이서현님 · 2026년 5월 기수"
4. 힌트 열기 → 힌트 텍스트 토글 확인
5. 새 탭에서 동일 URL 다시 열기 → 쿠키 남아있어 바로 `/` 로 들어감
6. 시크릿 창에서 `/` 만 접속 → `/expired` 로 리다이렉트 (middleware 작동 확인)

---

## 🚀 다음 세션 때 해볼만한 것

- Day 8 최종 투표 폼
- 어드민 `/messages` 에 webapp 링크 자동 생성
- 랜딩의 매칭 공개 상세 SNS 공유 (옵션)
- Claude API 매칭 (현재 휴리스틱을 Sonnet 호출로 교체)

---

**커밋:** 이 리포트 작성 후 autopilot이 자동으로 git push 수행.
