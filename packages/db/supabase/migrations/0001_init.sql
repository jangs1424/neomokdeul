-- =============================================================================
-- 너목들 (neomokdeul) — Initial Schema
-- Migration: 0001_init.sql
-- Created:   2026-04-21
--
-- Tables
--   cohorts       : One row per program run ("기수"). Admin manages like campaigns.
--   applications  : One row per applicant per cohort. Drives the approval workflow.
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
-- Represents a single program run. Multiple cohorts can recruit in parallel.
-- Admin creates / manages these like campaign objects.
-- ===========================================================================
create table cohorts (
  id                  uuid        primary key default gen_random_uuid(),

  -- URL-safe identifier used in page paths, e.g. "may-2026", "christmas-special"
  slug                text        not null unique,

  -- Human-readable display name, e.g. "2026년 5월 기수"
  name                text        not null,

  -- Long-form program description (markdown accepted)
  description         text,

  -- Lifecycle state machine:
  --   draft      → not yet visible to public
  --   recruiting → application form is live
  --   closed     → applications no longer accepted
  --   running    → 8-day program in progress
  --   completed  → program finished
  status              text        not null default 'draft'
                        check (status in ('draft','recruiting','closed','running','completed')),

  -- Actual 8-day program window
  program_start_date  date        not null,
  program_end_date    date        not null,

  -- Application window
  apply_opens_at      timestamptz not null,
  apply_closes_at     timestamptz not null,

  -- Participation fee in KRW (Latpeed payment)
  price_krw           integer     not null default 45000,

  -- Gender-balanced capacity caps
  max_male            integer     not null default 15,
  max_female          integer     not null default 15,

  -- Latpeed payment URL sent via SMS after admin approval.
  -- Each cohort may have a distinct URL.
  latpeed_payment_url text,

  -- ---- Per-cohort landing page overrides (optional) -----
  hero_title          text,
  hero_subtitle       text,
  hero_image_url      text,

  -- Tags for special editions, e.g. ARRAY['크리스마스 특집', '파티 포함']
  special_features    text[]      not null default '{}',

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table  cohorts                    is '너목들 기수(프로그램 회차). 어드민이 캠페인처럼 생성·관리한다.';
comment on column cohorts.slug               is 'URL 슬러그 (page path에 사용). 변경 불가 권장.';
comment on column cohorts.status             is 'draft|recruiting|closed|running|completed';
comment on column cohorts.latpeed_payment_url is '승인 후 SMS로 발송할 Latpeed 결제 링크. 기수마다 상이할 수 있음.';
comment on column cohorts.special_features   is '특집 태그 배열. 예: {크리스마스 특집, 파티 포함}';

-- auto-update trigger
create trigger cohorts_set_updated_at
  before update on cohorts
  for each row execute function set_updated_at();

-- Indexes
create index idx_cohorts_status      on cohorts (status);
create index idx_cohorts_created_at  on cohorts (created_at desc);


-- ===========================================================================
-- TABLE: applications
-- One row per applicant per cohort. Drives approval → SMS payment → confirmation.
-- ===========================================================================
create table applications (
  id                    uuid        primary key default gen_random_uuid(),

  -- Which cohort this application belongs to
  cohort_id             uuid        not null references cohorts(id) on delete restrict,

  -- ---- Basic identity -------------------------------------------------------
  name                  text        not null,
  phone                 text        not null,   -- E.164 or 010-xxxx-xxxx; used for SMS + exclusions
  gender                text        not null check (gender in ('male','female')),
  birth_year            integer     not null check (birth_year between 1960 and 2010),

  -- ---- New v2 fields --------------------------------------------------------
  -- Occupation free-text (e.g. "마케터", "개발자", "대학원생")
  occupation            text        not null,

  -- Region, e.g. '서울 강남', '서울 마포', '수도권', '기타'
  region                text        not null,

  -- Available call time slots selected by applicant
  -- e.g. ARRAY['평일저녁','주말오전','주말오후','주말저녁']
  call_times            text[]      not null default '{}',

  -- MBTI type; nullable, max 4 chars (e.g. 'INFJ')
  mbti                  text        check (mbti is null or length(mbti) <= 4),

  -- Has the applicant participated in a previous cohort?
  previous_cohort       boolean     not null default false,

  -- If previous_cohort=true, which cohort? (used for exclusions / matching context)
  previous_cohort_id    uuid        references cohorts(id),

  -- ---- Freeform answers -----------------------------------------------------
  -- Why they want to join (심사용)
  motivation            text        not null,

  -- How they heard about the program: '인스타','지인','검색','기타'
  source                text        not null,

  -- ---- Media uploads (Supabase Storage URLs) --------------------------------
  -- 30-second voice intro; admin-only playback
  voice_file_url        text,
  photo_file_url        text,

  -- ---- Legal ----------------------------------------------------------------
  -- Timestamp when applicant agreed to terms & privacy policy
  agreed_at             timestamptz not null,

  -- ---- Admin workflow -------------------------------------------------------
  -- pending → approved → payment SMS sent → payment completed
  -- pending → rejected
  status                text        not null default 'pending'
                          check (status in ('pending','approved','rejected')),

  -- Admin rejection reason or internal note
  note                  text,

  -- When the payment-link SMS was dispatched via Solapi
  payment_link_sent_at  timestamptz,

  -- Set by Latpeed webhook on successful payment
  payment_completed_at  timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- One application per phone number per cohort
  unique (cohort_id, phone)
);

comment on table  applications                       is '기수별 신청서. pending→approved/rejected→(결제SMS)→결제완료 워크플로.';
comment on column applications.phone                 is '010-xxxx-xxxx 또는 E.164. SMS 발송 및 블랙리스트·exclusions 기준.';
comment on column applications.call_times            is '통화 가능 시간대 배열. 매칭 하드필터에 사용.';
comment on column applications.voice_file_url        is 'Supabase Storage URL. 어드민만 청취 (1단 품질관리).';
comment on column applications.previous_cohort_id    is '재참가자의 이전 기수 ID. exclusions 자동 생성에 활용.';
comment on column applications.payment_link_sent_at  is 'Solapi SMS 발송 시각 (Latpeed 결제 링크).';
comment on column applications.payment_completed_at  is 'Latpeed 웹훅 수신 후 자동 설정.';

-- auto-update trigger
create trigger applications_set_updated_at
  before update on applications
  for each row execute function set_updated_at();

-- Indexes
create index idx_applications_cohort_id   on applications (cohort_id);
create index idx_applications_status      on applications (status);
create index idx_applications_phone       on applications (phone);
create index idx_applications_created_at  on applications (created_at desc);


-- ===========================================================================
-- Row Level Security (RLS)
-- ===========================================================================

-- --- cohorts ---------------------------------------------------------------
alter table cohorts enable row level security;

-- Anyone (anon) may read cohorts that are actively recruiting
create policy "cohorts_anon_select_recruiting"
  on cohorts
  for select
  to anon
  using (status = 'recruiting');

-- service_role bypasses RLS by default in Supabase — no explicit policy needed.
-- authenticated (admin) — full access via service_role key in admin backend.

-- --- applications ----------------------------------------------------------
alter table applications enable row level security;

-- Anon users may submit a new application (INSERT only).
-- Column-level restrictions are handled in the application layer;
-- RLS here simply allows the operation.
create policy "applications_anon_insert"
  on applications
  for insert
  to anon
  with check (true);

-- Anon users may NOT read other applicants' data.
-- (No SELECT policy for anon → blocked by default.)

-- service_role has full access (bypasses RLS).
