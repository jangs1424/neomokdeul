-- =============================================================================
-- 0008: Refactor match_responses to Tally 26-field structure
-- Drop provisional Likert/values fields (0 rows existed), add actual Tally cols.
-- Cohort: add match_form_closes_at + Day 1~5 editable prompts.
-- =============================================================================

-- ---------- cohorts ---------------------------------------------------------
alter table cohorts
  add column if not exists match_form_closes_at timestamptz,
  add column if not exists match_day1_prompt    text,
  add column if not exists match_day2_prompt    text,
  add column if not exists match_day3_prompt    text,
  add column if not exists match_day4_prompt    text,
  add column if not exists match_day5_prompt    text;

update cohorts
set
  match_day1_prompt = coalesce(match_day1_prompt, '나를 위로하는 최애 음식, 소울푸드는?'),
  match_day2_prompt = coalesce(match_day2_prompt, '나의 소소한 취미는?'),
  match_day3_prompt = coalesce(match_day3_prompt, '내가 가장 좋아하는 장소가 있다면?'),
  match_day4_prompt = coalesce(match_day4_prompt, '소울메이트와 이것만은 꼭 같이 하고 싶어요!'),
  match_day5_prompt = coalesce(match_day5_prompt, '(개인 미션) 전화 메이트에게 수행할 당신의 비밀 미션')
where match_day1_prompt is null or match_day2_prompt is null or match_day3_prompt is null
   or match_day4_prompt is null or match_day5_prompt is null;

comment on column cohorts.match_form_closes_at is '매칭 폼 수정 마감 시각. 이후 참가자는 read-only 뷰만.';
comment on column cohorts.match_day1_prompt    is '매칭 폼 Day 1 질문 텍스트 (호스트 편집 가능)';

-- ---------- match_responses: drop Likert/values, add Tally fields ----------
alter table match_responses
  drop column if exists conv_energy,
  drop column if exists conv_thinking,
  drop column if exists conv_planning,
  drop column if exists conv_pace,
  drop column if exists conv_depth,
  drop column if exists values_marriage,
  drop column if exists values_career,
  drop column if exists values_family,
  drop column if exists values_hobby,
  drop column if exists values_independence,
  drop column if exists day2_answer,
  drop column if exists day3_answer,
  drop column if exists day4_answer,
  drop column if exists day5_answer,
  drop column if exists day6_answer,
  drop column if exists day7_answer,
  drop column if exists call_times;

alter table match_responses
  -- Basic info (beyond nickname)
  add column if not exists munto_nickname       text,
  add column if not exists match_gender         text check (match_gender is null or match_gender in ('opposite','same','any')),
  add column if not exists phone_type           text check (phone_type is null or phone_type in ('iphone','galaxy','other')),

  -- 대화 성향 (3)
  add column if not exists conv_style_self      text,   -- 대화할 때 이런 사람 같아요
  add column if not exists conv_with_strangers  text,   -- 낯선이와 함께할 때
  add column if not exists conv_attraction      text,   -- 매력 포인트

  -- 이상형·가치관 (4)
  add column if not exists ideal_important      text,   -- 사람 볼 때 중요한 것
  add column if not exists ideal_soulmate_must  text,   -- 소울메이트라면 이건 맞아야지
  add column if not exists ideal_relationship   text,   -- 기대하는 관계
  add column if not exists ideal_partner_q      text,   -- 파트너에게 하고 싶은 질문

  -- Day 1~5
  add column if not exists day1_soulfood        text,
  add column if not exists day2_hobby           text,
  add column if not exists day3_place           text,
  add column if not exists day4_together        text,
  add column if not exists day5_secret_mission  text,

  -- Schedule
  add column if not exists weekday_times        text[] not null default '{}',
  add column if not exists weekend_times        text[] not null default '{}',
  add column if not exists gathering_dates      text[] not null default '{}',

  -- Consent
  add column if not exists marketing_agreed     boolean not null default false;

comment on column match_responses.match_gender       is 'opposite | same | any';
comment on column match_responses.phone_type         is 'iphone | galaxy | other (매칭 시 오픈카톡 방식 결정용)';
comment on column match_responses.weekday_times      is '평일 통화 가능 시간대 (예: morning/afternoon/evening/night)';
comment on column match_responses.weekend_times      is '주말 통화 가능 시간대';
comment on column match_responses.gathering_dates    is '오프라인 개더링 참여 가능 날짜';
