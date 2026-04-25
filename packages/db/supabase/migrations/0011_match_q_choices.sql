-- =============================================================================
-- 0011: 객관식 선택지 지원 — 매칭폼 본 질문 7개 전체
--       값이 NULL 또는 빈 배열 → 기존 자유서술(textarea)
--       값이 1개 이상 → 매칭폼이 라디오로 렌더링
-- =============================================================================

alter table cohorts
  add column if not exists match_q_conv_style_self_choices       text[],
  add column if not exists match_q_conv_with_strangers_choices   text[],
  add column if not exists match_q_conv_attraction_choices       text[],
  add column if not exists match_q_ideal_important_choices       text[],
  add column if not exists match_q_ideal_soulmate_must_choices   text[],
  add column if not exists match_q_ideal_relationship_choices    text[],
  add column if not exists match_q_ideal_partner_q_choices       text[];

comment on column cohorts.match_q_conv_style_self_choices       is '대화 스타일(Q1) 객관식 선택지. 비어있으면 자유서술.';
comment on column cohorts.match_q_conv_with_strangers_choices   is '낯선이와 함께할 때(Q2) 객관식 선택지.';
comment on column cohorts.match_q_conv_attraction_choices       is '매력 포인트(Q3) 객관식 선택지.';
comment on column cohorts.match_q_ideal_important_choices       is '사람 볼 때 중요한 것(Q4) 객관식 선택지.';
comment on column cohorts.match_q_ideal_soulmate_must_choices   is '소울메이트라면(Q5) 객관식 선택지.';
comment on column cohorts.match_q_ideal_relationship_choices    is '기대하는 관계(Q6) 객관식 선택지.';
comment on column cohorts.match_q_ideal_partner_q_choices       is '파트너에게 하고 싶은 질문(Q7) 객관식 선택지.';
