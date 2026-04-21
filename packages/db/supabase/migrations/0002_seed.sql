-- =============================================================================
-- 너목들 (neomokdeul) — Seed Data
-- Migration: 0002_seed.sql
-- Created:   2026-04-21
--
-- Seeds one test cohort for local development and staging.
-- Do NOT run this on production unless you intend it to be the first real cohort.
-- =============================================================================

insert into cohorts (
  slug,
  name,
  description,
  status,
  program_start_date,
  program_end_date,
  apply_opens_at,
  apply_closes_at,
  price_krw
)
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
);
