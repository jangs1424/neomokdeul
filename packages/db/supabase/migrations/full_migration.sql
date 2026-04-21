-- =============================================================================
-- 너목들 (neomokdeul) — FULL MIGRATION (0001 + 0002 combined)
-- Paste this into Supabase SQL Editor and click Run once.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Utility: auto-update updated_at on any row update
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- TABLE: cohorts
-- ===========================================================================
create table if not exists cohorts (
  id                  uuid        primary key default gen_random_uuid(),
  slug                text        not null unique,
  name                text        not null,
  description         text,
  status              text        not null default 'draft'
                        check (status in ('draft','recruiting','closed','running','completed')),
  program_start_date  date        not null,
  program_end_date    date        not null,
  apply_opens_at      timestamptz not null,
  apply_closes_at     timestamptz not null,
  price_krw           integer     not null default 45000,
  max_male            integer     not null default 15,
  max_female          integer     not null default 15,
  latpeed_payment_url text,
  hero_title          text,
  hero_subtitle       text,
  hero_image_url      text,
  special_features    text[]      not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists cohorts_set_updated_at on cohorts;
create trigger cohorts_set_updated_at
  before update on cohorts
  for each row execute function set_updated_at();

create index if not exists idx_cohorts_status      on cohorts (status);
create index if not exists idx_cohorts_created_at  on cohorts (created_at desc);

-- ===========================================================================
-- TABLE: applications
-- ===========================================================================
create table if not exists applications (
  id                    uuid        primary key default gen_random_uuid(),
  cohort_id             uuid        not null references cohorts(id) on delete restrict,
  name                  text        not null,
  phone                 text        not null,
  gender                text        not null check (gender in ('male','female')),
  birth_year            integer     not null check (birth_year between 1960 and 2010),
  occupation            text        not null,
  region                text        not null,
  call_times            text[]      not null default '{}',
  mbti                  text        check (mbti is null or length(mbti) <= 4),
  previous_cohort       boolean     not null default false,
  previous_cohort_id    uuid        references cohorts(id),
  motivation            text        not null,
  source                text        not null,
  voice_file_url        text,
  photo_file_url        text,
  agreed_at             timestamptz not null,
  status                text        not null default 'pending'
                          check (status in ('pending','approved','rejected')),
  note                  text,
  payment_link_sent_at  timestamptz,
  payment_completed_at  timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (cohort_id, phone)
);

drop trigger if exists applications_set_updated_at on applications;
create trigger applications_set_updated_at
  before update on applications
  for each row execute function set_updated_at();

create index if not exists idx_applications_cohort_id   on applications (cohort_id);
create index if not exists idx_applications_status      on applications (status);
create index if not exists idx_applications_phone       on applications (phone);
create index if not exists idx_applications_created_at  on applications (created_at desc);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table cohorts       enable row level security;
alter table applications  enable row level security;

drop policy if exists "cohorts_anon_select_recruiting" on cohorts;
create policy "cohorts_anon_select_recruiting"
  on cohorts for select to anon
  using (status = 'recruiting');

drop policy if exists "applications_anon_insert" on applications;
create policy "applications_anon_insert"
  on applications for insert to anon
  with check (true);

-- ===========================================================================
-- Seed data
-- ===========================================================================
insert into cohorts (slug, name, description, status, program_start_date, program_end_date, apply_opens_at, apply_closes_at, price_krw)
values (
  'may-2026',
  '2026년 5월 기수',
  '첫 번째 공식 기수. 얼굴 대신 목소리부터 시작되는 8일간의 익명 전화 실험.',
  'recruiting',
  '2026-05-15',
  '2026-05-22',
  '2026-04-20T00:00:00+09:00',
  '2026-05-10T23:59:00+09:00',
  45000
)
on conflict (slug) do nothing;
