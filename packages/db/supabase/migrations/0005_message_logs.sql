-- =============================================================================
-- 0005: message_logs — outbound SMS audit trail
--
-- Every send attempt (승인 후 Latpeed 결제링크 발송) is logged here.
-- Enables: 발송완료/실패 탭 UI, 중복 발송 방지, 실패 수동 재시도.
-- Retry policy: 1회 자동 재시도(5초 후) → 실패 시 attempt_count=2, status='failed'.
-- =============================================================================

create table if not exists message_logs (
  id                  uuid        primary key default gen_random_uuid(),
  application_id      uuid        not null references applications(id) on delete cascade,
  cohort_id           uuid        not null references cohorts(id)      on delete restrict,
  phone               text        not null,
  message_body        text        not null,      -- final rendered (variables substituted)
  template_used       text,                      -- raw template at send time (audit)
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

-- Auto-update updated_at (reuses function from 0001_init.sql)
drop trigger if exists trg_message_logs_updated_at on message_logs;
create trigger trg_message_logs_updated_at
  before update on message_logs
  for each row execute function set_updated_at();
