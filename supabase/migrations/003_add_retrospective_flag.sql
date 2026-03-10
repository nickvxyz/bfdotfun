-- Add retrospective tracking to users
alter table public.users
  add column if not exists has_used_retrospective boolean not null default false;

-- Expand submission_type to include 'retrospective'
alter table public.submissions
  drop constraint if exists submissions_submission_type_check;

alter table public.submissions
  add constraint submissions_submission_type_check
  check (submission_type in ('individual', 'pro_group', 'retrospective'));
