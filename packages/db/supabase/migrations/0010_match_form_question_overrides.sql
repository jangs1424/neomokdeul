-- =============================================================================
-- 0010: Per-cohort editable prompts for all 7 main match-form questions
--       (대화 성향 3 + 이상형·가치관 4). Day 1~5 prompts were added in 0008.
--       Empty/null → webapp falls back to the default Tally wording.
-- =============================================================================

alter table cohorts
  add column if not exists match_q_conv_style_self      text,
  add column if not exists match_q_conv_with_strangers  text,
  add column if not exists match_q_conv_attraction      text,
  add column if not exists match_q_ideal_important      text,
  add column if not exists match_q_ideal_soulmate_must  text,
  add column if not exists match_q_ideal_relationship   text,
  add column if not exists match_q_ideal_partner_q      text;

-- Seed existing cohorts with the Tally defaults (so admin sees them pre-filled)
update cohorts
set
  match_q_conv_style_self     = coalesce(match_q_conv_style_self,     '저는 대화할 때 이런 사람 같아요!'),
  match_q_conv_with_strangers = coalesce(match_q_conv_with_strangers, '낯선이와 함께할 때 저는 이래요!'),
  match_q_conv_attraction     = coalesce(match_q_conv_attraction,     '남들에게 칭찬받는 대화할 때의 나의 매력 포인트?'),
  match_q_ideal_important     = coalesce(match_q_ideal_important,     '사람을 볼 때 당신이 가장 중요하게 보는 것은?'),
  match_q_ideal_soulmate_must = coalesce(match_q_ideal_soulmate_must, '소울메이트라면 이건 맞아야지!'),
  match_q_ideal_relationship  = coalesce(match_q_ideal_relationship,  '나의 전화 메이트와 이런 관계를 기대하고 있어요!'),
  match_q_ideal_partner_q     = coalesce(match_q_ideal_partner_q,     '이번 커넥팅 기간 동안 내 파트너에게 꼭 하고 싶은 질문 한가지?');

comment on column cohorts.match_q_conv_style_self      is '매칭 폼 "대화할 때 이런 사람" 질문 문구 (호스트 편집)';
comment on column cohorts.match_q_ideal_important      is '매칭 폼 "사람 볼 때 중요한 것" 질문 문구 (호스트 편집)';
