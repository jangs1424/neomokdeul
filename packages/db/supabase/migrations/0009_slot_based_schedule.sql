-- =============================================================================
-- 0009: Replace weekday/weekend arrays with date-specific slot strings.
-- Format: "YYYY-MM-DD_HH-HH" (e.g. "2026-05-15_18-22")
-- Enables per-cohort program-window scheduling + round-scoped overlap rules.
-- =============================================================================

alter table match_responses
  drop column if exists weekday_times,
  drop column if exists weekend_times;

alter table match_responses
  add column if not exists available_slots text[] not null default '{}';

comment on column match_responses.available_slots is
  '참가자가 통화 가능 표시한 구체 슬롯 배열. 포맷 "YYYY-MM-DD_HH-HH", 예: "2026-05-15_18-22". 프로그램 기간 내 날짜만 유효.';

-- Helpful GIN index for overlap queries (used by matching algorithm)
create index if not exists idx_match_responses_available_slots
  on match_responses using gin (available_slots);
