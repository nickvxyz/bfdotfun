-- 006_teams.sql — Teams feature migration
-- Run manually in Supabase dashboard (per migration rule)

-- 1. Add columns to pro_groups
ALTER TABLE public.pro_groups
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS total_kg_burned numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_kg_submitted numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS member_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_pro_groups_slug ON public.pro_groups (slug);

-- 2. New table: team_memberships
CREATE TABLE public.team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.pro_groups (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'rejected', 'left')),
  invite_code text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_memberships_team ON public.team_memberships (team_id, status);
CREATE INDEX idx_team_memberships_user ON public.team_memberships (user_id, status);

-- 3. New table: team_invite_codes
CREATE TABLE public.team_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.pro_groups (id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  max_uses integer NOT NULL DEFAULT 50,
  use_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES public.users (id),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_invite_codes_code ON public.team_invite_codes (code);

-- 4. Expand burn_units status enum
ALTER TABLE public.burn_units DROP CONSTRAINT IF EXISTS burn_units_status_check;
ALTER TABLE public.burn_units ADD CONSTRAINT burn_units_status_check
  CHECK (status IN ('unsubmitted', 'submitted_individual', 'submitted_via_pro',
    'attributed_to_challenge', 'auto_submitted_challenge', 'team_pooled'));

-- 5. Trigger: sync membership <-> user.group_id + member_count
CREATE OR REPLACE FUNCTION public.sync_team_membership()
RETURNS trigger AS $$
BEGIN
  -- Approved: set user's group_id, increment member count
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    UPDATE public.users SET group_id = NEW.team_id WHERE id = NEW.user_id;
    UPDATE public.pro_groups SET member_count = member_count + 1 WHERE id = NEW.team_id;
    NEW.resolved_at = now();
  END IF;

  -- Left: clear user's group_id, decrement member count
  IF NEW.status = 'left' AND OLD.status = 'active' THEN
    UPDATE public.users SET group_id = NULL WHERE id = NEW.user_id;
    UPDATE public.pro_groups SET member_count = member_count - 1 WHERE id = NEW.team_id;
    NEW.resolved_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_team_membership_sync
  BEFORE UPDATE ON public.team_memberships
  FOR EACH ROW EXECUTE FUNCTION public.sync_team_membership();

-- 6. RLS (service role bypasses — same pattern as other tables)
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_memberships_service" ON public.team_memberships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "team_invite_codes_service" ON public.team_invite_codes FOR ALL USING (true) WITH CHECK (true);
