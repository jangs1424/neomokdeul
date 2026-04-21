-- =============================================================================
-- FULL MIGRATION ROUND 2 (combines 0004 + 0005)
-- Paste this into Supabase SQL Editor → Run.
-- Depends on: full_migration.sql (round 1) already executed.
-- =============================================================================

-- 0004: matchings + exclusions
create table if not exists matchings (
  id                       uuid primary key default gen_random_uuid(),
  cohort_id                uuid not null references cohorts(id) on delete cascade,
  round                    integer not null check (round in (1, 2)),
  male_application_id      uuid not null references applications(id) on delete restrict,
  female_application_id    uuid not null references applications(id) on delete restrict,
  score                    numeric(3,2),
  reasoning                text,
  status                   text not null default 'draft'
                             check (status in ('draft','published','superseded')),
  superseded_by            uuid references matchings(id),
  published_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (cohort_id, round, male_application_id) deferrable initially deferred,
  unique (cohort_id, round, female_application_id) deferrable initially deferred
);

create index if not exists idx_matchings_cohort_id on matchings(cohort_id);
create index if not exists idx_matchings_status   on matchings(status);
create index if not exists idx_matchings_round    on matchings(round);

drop trigger if exists matchings_set_updated_at on matchings;
create trigger matchings_set_updated_at
  before update on matchings
  for each row execute function set_updated_at();

create table if not exists exclusions (
  id                 uuid primary key default gen_random_uuid(),
  phone_a            text not null,
  phone_b            text not null,
  reason             text,
  source_cohort_id   uuid references cohorts(id),
  created_at         timestamptz not null default now(),
  check (phone_a < phone_b),
  unique (phone_a, phone_b)
);

create index if not exists idx_exclusions_phone_a on exclusions(phone_a);
create index if not exists idx_exclusions_phone_b on exclusions(phone_b);

-- 0005: message_logs
create table if not exists message_logs (
  id                  uuid        primary key default gen_random_uuid(),
  application_id      uuid        not null references applications(id) on delete cascade,
  cohort_id           uuid        not null references cohorts(id)      on delete restrict,
  phone               text        not null,
  message_body        text        not null,
  template_used       text,
  provider            text        not null default 'solapi',
  provider_message_id text,
  status              text        not null default 'queued'
                        check (status in ('queued','sent','failed','retrying')),
  attempt_count       integer     not null default 0,
  last_error          text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_message_logs_application_id on message_logs(application_id);
create index if not exists idx_message_logs_status         on message_logs(status);
create index if not exists idx_message_logs_created_at     on message_logs(created_at desc);

drop trigger if exists trg_message_logs_updated_at on message_logs;
create trigger trg_message_logs_updated_at
  before update on message_logs
  for each row execute function set_updated_at();
