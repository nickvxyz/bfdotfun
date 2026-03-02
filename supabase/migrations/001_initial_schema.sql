-- BurnFat.fun — Initial Schema
-- Run this in your Supabase SQL editor or via CLI

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text unique not null,
  display_name text,
  role text not null default 'individual' check (role in ('individual', 'coach', 'gym', 'company')),
  starting_weight numeric,
  goal_weight numeric,
  unit_pref text not null default 'kg' check (unit_pref in ('kg', 'lbs')),
  group_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_wallet on public.users (wallet_address);
create index idx_users_group on public.users (group_id);

-- ============================================================
-- PRO GROUPS (Phase 4, created now for FK references)
-- ============================================================
create table public.pro_groups (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users (id),
  name text not null,
  type text not null default 'coach' check (type in ('coach', 'gym', 'company')),
  subscription_status text not null default 'none' check (subscription_status in ('active', 'expired', 'none')),
  subscription_tx_hash text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Add FK from users.group_id → pro_groups.id
alter table public.users
  add constraint fk_users_group
  foreign key (group_id) references public.pro_groups (id) on delete set null;

-- ============================================================
-- WEIGHT ENTRIES
-- ============================================================
create table public.weight_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  weight_kg numeric not null,
  recorded_at date not null,
  delta_kg numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, recorded_at)
);

create index idx_weight_entries_user on public.weight_entries (user_id, recorded_at desc);

-- ============================================================
-- BURN UNITS (anti-duplication core)
-- ============================================================
create table public.burn_units (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  weight_entry_id uuid not null references public.weight_entries (id) on delete cascade,
  kg_amount numeric not null check (kg_amount > 0),
  status text not null default 'unsubmitted' check (status in ('unsubmitted', 'submitted_individual', 'submitted_via_pro')),
  submission_id uuid,
  created_at timestamptz not null default now()
);

create index idx_burn_units_user on public.burn_units (user_id, status);

-- ============================================================
-- SUBMISSIONS
-- ============================================================
create table public.submissions (
  id uuid primary key default uuid_generate_v4(),
  submitter_id uuid not null references public.users (id),
  kg_total numeric not null,
  usdc_amount numeric not null default 0,
  tx_hash text unique,
  submission_type text not null check (submission_type in ('individual', 'pro_group')),
  group_id uuid references public.pro_groups (id),
  created_at timestamptz not null default now()
);

-- Add FK from burn_units.submission_id → submissions.id
alter table public.burn_units
  add constraint fk_burn_units_submission
  foreign key (submission_id) references public.submissions (id);

-- ============================================================
-- GLOBAL COUNTER (singleton)
-- ============================================================
create table public.global_counter (
  id integer primary key default 1 check (id = 1),
  total_kg numeric not null default 0,
  total_submissions integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Seed the singleton row
insert into public.global_counter (id, total_kg, total_submissions) values (1, 0, 0);

-- ============================================================
-- TRIGGER: update global_counter on new submission
-- ============================================================
create or replace function public.update_global_counter()
returns trigger as $$
begin
  update public.global_counter
  set
    total_kg = total_kg + NEW.kg_total,
    total_submissions = total_submissions + 1,
    updated_at = now()
  where id = 1;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_submission_insert
  after insert on public.submissions
  for each row execute function public.update_global_counter();

-- ============================================================
-- TRIGGER: auto-update updated_at on users
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.weight_entries enable row level security;
alter table public.burn_units enable row level security;
alter table public.submissions enable row level security;
alter table public.global_counter enable row level security;
alter table public.pro_groups enable row level security;

-- Global counter: anyone can read
create policy "global_counter_read" on public.global_counter
  for select using (true);

-- Users: service role handles all operations via API routes
-- Anon key gets read-only on own row (matched by session cookie on server)
-- For MVP, API routes use service role key, so we allow all via service role
create policy "users_all_service" on public.users
  for all using (true) with check (true);

create policy "weight_entries_all_service" on public.weight_entries
  for all using (true) with check (true);

create policy "burn_units_all_service" on public.burn_units
  for all using (true) with check (true);

create policy "submissions_all_service" on public.submissions
  for all using (true) with check (true);

create policy "pro_groups_all_service" on public.pro_groups
  for all using (true) with check (true);
