-- =============================================================================
-- 0004: matchings + exclusions — 1차/2차 매칭 쌍 저장 및 제외 규칙
--
-- matchings   : 기수별 1차/2차 매칭 쌍. draft → published → superseded 상태머신.
-- exclusions  : 전화번호 쌍 단위의 매칭 금지 (정규화 저장: phone_a < phone_b).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLE: matchings
-- One row per (cohort, round, male, female) pair.
-- ---------------------------------------------------------------------------
create table if not exists matchings (
  id                       uuid primary key default gen_random_uuid(),
  cohort_id                uuid not null references cohorts(id) on delete cascade,
  round                    integer not null check (round in (1, 2)),
  male_application_id      uuid not null references applications(id) on delete restrict,
  female_application_id    uuid not null references applications(id) on delete restrict,
  score                    numeric(3,2),            -- 0.00 ~ 1.00
  reasoning                text,                    -- LLM explanation (stub in MVP)
  status                   text not null default 'draft'
                             check (status in ('draft','published','superseded')),
  superseded_by            uuid references matchings(id),
  published_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  -- A male/female applicant can have only 1 active match per round per cohort
  unique (cohort_id, round, male_application_id) deferrable initially deferred,
  unique (cohort_id, round, female_application_id) deferrable initially deferred
);

create index if not exists idx_matchings_cohort_id on matchings(cohort_id);
create index if not exists idx_matchings_status   on matchings(status);
create index if not exists idx_matchings_round    on matchings(round);

-- reuse set_updated_at() from 0001_init.sql
drop trigger if exists matchings_set_updated_at on matchings;
create trigger matchings_set_updated_at
  before update on matchings
  for each row execute function set_updated_at();


-- ---------------------------------------------------------------------------
-- TABLE: exclusions
-- Pair-level blocks (phone-pair; normalized so phone_a < phone_b).
-- ---------------------------------------------------------------------------
create table if not exists exclusions (
  id                 uuid primary key default gen_random_uuid(),
  phone_a            text not null,
  phone_b            text not null,
  reason             text,
  source_cohort_id   uuid references cohorts(id),
  created_at         timestamptz not null default now(),
  -- Always store with phone_a < phone_b lexicographically
  check (phone_a < phone_b),
  unique (phone_a, phone_b)
);

create index if not exists idx_exclusions_phone_a on exclusions(phone_a);
create index if not exists idx_exclusions_phone_b on exclusions(phone_b);
