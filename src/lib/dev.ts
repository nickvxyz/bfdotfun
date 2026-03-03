import type { User } from "@/lib/auth";

export const IS_DEV_MODE =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "your-anon-key-here" ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const DEV_USER: User = {
  id: "dev-user-001",
  wallet_address: "0xd3v0000000000000000000000000000000000001",
  display_name: "Dev User",
  role: "individual",
  starting_weight: null,
  goal_weight: null,
  height_cm: null,
  unit_pref: "kg",
  group_id: null,
  has_used_retrospective: false,
};
