-- =============================================================================
-- 0007: match_responses — per-applicant matching form answers
-- Filled on Day 1 (21:00–23:59) AFTER admin approval + payment.
-- Drives matching algorithm. Application form stays focused on admin review.
-- =============================================================================

create table if not exists match_responses (
  id                  uuid        primary key default gen_random_uuid(),
  application_id      uuid        not null references applications(id) on delete cascade,
  cohort_id           uuid        not null references cohorts(id)      on delete restrict,

  -- Header (user may refresh regional/time/mbti choices from the application form)
  nickname            text        not null,
  region              text        not null,
  call_times          text[]      not null default '{}',
  mbti                text        check (mbti is null or length(mbti) <= 4),

  -- Conversation style (1-5 Likert scale)
  --   energy:   1=introvert  ↔  5=extrovert
  --   thinking: 1=logical    ↔  5=emotional
  --   planning: 1=planner    ↔  5=spontaneous
  --   pace:     1=listener   ↔  5=talker
  --   depth:    1=light chat ↔  5=deep talk
  conv_energy         integer     check (conv_energy   between 1 and 5),
  conv_thinking       integer     check (conv_thinking between 1 and 5),
  conv_planning       integer     check (conv_planning between 1 and 5),
  conv_pace           integer     check (conv_pace     between 1 and 5),
  conv_depth          integer     check (conv_depth    between 1 and 5),

  -- Values (1=not important, 5=very important)
  values_marriage     integer     check (values_marriage     between 1 and 5),
  values_career       integer     check (values_career       between 1 and 5),
  values_family       integer     check (values_family       between 1 and 5),
  values_hobby        integer     check (values_hobby        between 1 and 5),
  values_independence integer     check (values_independence between 1 and 5),

  -- Day-by-day share topics (Day 2 ~ Day 7)
  day2_answer         text,
  day3_answer         text,
  day4_answer         text,
  day5_answer         text,
  day6_answer         text,
  day7_answer         text,

  -- Male only (카카오 오픈채팅방 링크)
  kakao_openchat_url  text,

  submitted_at        timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (application_id)
);

create index if not exists idx_match_responses_cohort_id    on match_responses(cohort_id);
create index if not exists idx_match_responses_submitted_at on match_responses(submitted_at desc);

drop trigger if exists match_responses_set_updated_at on match_responses;
create trigger match_responses_set_updated_at
  before update on match_responses
  for each row execute function set_updated_at();

alter table match_responses enable row level security;
-- No anon policies — service_role only.  Webapp API writes via service_role.
