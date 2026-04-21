# 🚨 오토파일럿 실패 시 Fallback

## 언제 필요?
- 아침에 일어났는데 `docs/phase-9-report.md` 파일이 없음
- 또는 GitHub에 Phase 9 커밋이 없음 (`git log --oneline -5`로 확인)

## 이유
- Claude Code 터미널이 밤 중에 닫혔거나
- PC가 슬립 모드로 들어갔거나
- Cron이 세션 종료와 함께 사라짐 (durable 옵션 미적용)

## 해결 — Claude Code에 이 한 줄 붙여넣으면 끝

```
오토파일럿 Phase 9 시작 — docs/participant-webapp-spec.md 따라서 참가자 웹앱 만들어줘. 3개 에이전트 병렬로 돌리고 커밋 푸시까지 완료 후 docs/phase-9-report.md 에 보고.
```

## 스펙 위치
- 완전 스펙: `docs/participant-webapp-spec.md`
- 크론 복구 불필요 (한 번만 실행되면 됨)
