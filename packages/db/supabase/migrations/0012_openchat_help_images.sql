-- =============================================================================
-- 0012: 매칭폼 7번(1:1 오픈채팅) 섹션에 표시할 호스트 설명 이미지 URL 목록
-- =============================================================================

alter table cohorts
  add column if not exists kakao_openchat_help_image_urls text[];

comment on column cohorts.kakao_openchat_help_image_urls
  is '매칭폼 1:1 오픈채팅 섹션에 보여줄 설명 이미지 URL 목록 (남자 참가자용).';
