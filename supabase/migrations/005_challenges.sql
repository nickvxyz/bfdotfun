-- BurnFat.fun — Challenges Feature Schema
-- Run in Supabase SQL Editor

-- ============================================================
-- CHALLENGES
-- ============================================================
create table public.challenges (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  description text,
  creator_id uuid not null references public.users (id),
  visibility text not null default 'public' check (visibility in ('public', 'private', 'invite_only')),
  email_domain text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  claim_deadline timestamptz not null,
  prize_pool_usdc numeric not null default 0,
  pool_tx_hash text,
  contract_challenge_id integer,
  merkle_root text,
  status text not null default 'draft' check (status in ('draft', 'active', 'ended', 'finalized', 'cancelled')),
  min_entries integer not null default 3,
  min_positive_deltas integer not null default 1,
  participant_count integer not null default 0,
  total_kg_burned numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_challenges_slug on public.challenges (slug);
create index idx_challenges_status on public.challenges (status);
create index idx_challenges_creator on public.challenges (creator_id);

-- ============================================================
-- CHALLENGE PARTICIPANTS
-- ============================================================
create table public.challenge_participants (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  kg_burned numeric not null default 0,
  entry_count integer not null default 0,
  reward_usdc numeric,
  reward_claimed boolean not null default false,
  claim_tx_hash text,
  invite_code text,
  joined_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create index idx_challenge_participants_challenge on public.challenge_participants (challenge_id);
create index idx_challenge_participants_user on public.challenge_participants (user_id);

-- ============================================================
-- CHALLENGE INVITE CODES
-- ============================================================
create table public.challenge_invite_codes (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  code text unique not null,
  max_uses integer not null default 1,
  use_count integer not null default 0,
  created_by uuid not null references public.users (id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_invite_codes_challenge on public.challenge_invite_codes (challenge_id);
create index idx_invite_codes_code on public.challenge_invite_codes (code);

-- ============================================================
-- EMAIL VERIFICATIONS
-- ============================================================
create table public.email_verifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  email text not null,
  domain text not null,
  code text not null,
  verified boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_email_verifications_user on public.email_verifications (user_id);

-- ============================================================
-- CHALLENGE WEIGHT ENTRIES (junction table)
-- ============================================================
create table public.challenge_weight_entries (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  weight_entry_id uuid not null references public.weight_entries (id) on delete cascade,
  participant_id uuid not null references public.challenge_participants (id) on delete cascade,
  delta_kg numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (challenge_id, weight_entry_id)
);

create index idx_challenge_weight_entries_challenge on public.challenge_weight_entries (challenge_id);
create index idx_challenge_weight_entries_participant on public.challenge_weight_entries (participant_id);

-- ============================================================
-- MODIFY EXISTING TABLES
-- ============================================================

-- Users: add verified email fields
alter table public.users
  add column if not exists verified_email text,
  add column if not exists verified_email_domain text;

-- Burn units: expand status check and add challenge_id FK
alter table public.burn_units
  drop constraint if exists burn_units_status_check;

alter table public.burn_units
  add constraint burn_units_status_check
  check (status in ('unsubmitted', 'submitted_individual', 'submitted_via_pro', 'attributed_to_challenge', 'auto_submitted_challenge'));

alter table public.burn_units
  add column if not exists challenge_id uuid references public.challenges (id);

-- Submissions: expand submission_type check
alter table public.submissions
  drop constraint if exists submissions_submission_type_check;

alter table public.submissions
  add constraint submissions_submission_type_check
  check (submission_type in ('individual', 'pro_group', 'retrospective', 'challenge_auto'));

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Update challenge_participants.kg_burned on challenge_weight_entries insert
create or replace function public.update_challenge_participant_stats()
returns trigger as $$
begin
  if NEW.delta_kg > 0 then
    update public.challenge_participants
    set
      kg_burned = kg_burned + NEW.delta_kg,
      entry_count = entry_count + 1
    where id = NEW.participant_id;

    update public.challenges
    set total_kg_burned = total_kg_burned + NEW.delta_kg
    where id = NEW.challenge_id;
  else
    update public.challenge_participants
    set entry_count = entry_count + 1
    where id = NEW.participant_id;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_challenge_weight_entry_insert
  after insert on public.challenge_weight_entries
  for each row execute function public.update_challenge_participant_stats();

-- Update challenges.participant_count on participant insert/delete
create or replace function public.update_challenge_participant_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.challenges
    set participant_count = participant_count + 1
    where id = NEW.challenge_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.challenges
    set participant_count = participant_count - 1
    where id = OLD.challenge_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger trg_challenge_participant_count
  after insert or delete on public.challenge_participants
  for each row execute function public.update_challenge_participant_count();

-- Auto-update updated_at on challenges
create trigger trg_challenges_updated_at
  before update on public.challenges
  for each row execute function public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.challenge_invite_codes enable row level security;
alter table public.email_verifications enable row level security;
alter table public.challenge_weight_entries enable row level security;

-- Service role policies (same pattern as existing tables)
create policy "challenges_all_service" on public.challenges
  for all using (true) with check (true);

create policy "challenge_participants_all_service" on public.challenge_participants
  for all using (true) with check (true);

create policy "challenge_invite_codes_all_service" on public.challenge_invite_codes
  for all using (true) with check (true);

create policy "email_verifications_all_service" on public.email_verifications
  for all using (true) with check (true);

create policy "challenge_weight_entries_all_service" on public.challenge_weight_entries
  for all using (true) with check (true);
