-- =============================================================================
-- 0003: Per-cohort editable copy (form + SMS)
--
-- Admin can edit (per cohort) without code changes:
--  - 승인 SMS 템플릿
--  - 폼 상단 인트로 문구
--  - 음성 자소 help text
--  - 얼굴 사진 help text
--  - 지원 동기 prompt
--
-- Rejection messages are intentionally NOT supported (cost-cutting).
-- =============================================================================

alter table cohorts
  add column if not exists approved_sms_template text,
  add column if not exists apply_intro_text       text,
  add column if not exists voice_intro_help       text,
  add column if not exists photo_help             text,
  add column if not exists motivation_prompt      text;

update cohorts
set
  approved_sms_template = coalesce(
    approved_sms_template,
    E'[너목들] 안녕하세요 {{name}}님, {{cohort_name}} 참가 승인되셨어요 🎉\n\n참가비 결제 링크:\n{{payment_url}}\n\n• 결제 기한: {{deadline}}\n• 결제 완료 시 OT 일정·오픈채팅 링크를 안내드릴게요\n• 문의: @socially_official\n\n기다렸습니다 :)'
  ),
  apply_intro_text = coalesce(
    apply_intro_text,
    '간단한 심사 후 승인 여부를 문자로 안내드려요.'
  ),
  voice_intro_help = coalesce(
    voice_intro_help,
    E'너목들은 얼굴보다 목소리가 먼저인 프로그램이에요. 호스트가 대화 톤과 말의 결을 확인하는 데 사용합니다.\n예시: "안녕하세요, 저는 ○○에서 일하고 평소에 ○○을 좋아해요. 새로운 사람 만나는 걸 기대하고 있어요." (30초 이내)'
  ),
  photo_help = coalesce(
    photo_help,
    '호스트만 심사용으로 확인하고, 참가자 간에는 프로그램 기간 내내 공개되지 않아요. 최종 매칭 후 서로 "예"를 선택하면 연락처가 교환됩니다.'
  ),
  motivation_prompt = coalesce(
    motivation_prompt,
    '왜 이 프로그램에 지원하시나요? 어떤 경험을 기대하는지 2~4줄 편하게 적어주세요.'
  );

comment on column cohorts.approved_sms_template is '승인 SMS 템플릿. 변수: {{name}} {{cohort_name}} {{payment_url}} {{deadline}}';
comment on column cohorts.apply_intro_text      is '/apply 페이지 상단 인트로 문구';
comment on column cohorts.voice_intro_help      is '음성 자소 필드 아래 설명';
comment on column cohorts.photo_help            is '얼굴 사진 필드 아래 설명';
comment on column cohorts.motivation_prompt     is '지원 동기 textarea placeholder/prompt';
