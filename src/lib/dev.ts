import type { User } from "@/lib/auth";

export const IS_DEV_MODE =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "your-anon-key-here" ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const DEV_USER: User = {
  id: "dev-user-001",
  wallet_address: "0xd3v0000000000000000000000000000000000001",
  display_name: "Dev User",
  role: "individual",
  starting_weight: 92,
  goal_weight: 78,
  height_cm: 178,
  unit_pref: "kg",
  group_id: null,
};

export const DEV_ENTRIES = [
  { id: "e1", user_id: "dev-user-001", weight_kg: 92.0, recorded_at: "2026-02-01", delta_kg: 0 },
  { id: "e2", user_id: "dev-user-001", weight_kg: 91.3, recorded_at: "2026-02-08", delta_kg: 0.7 },
  { id: "e3", user_id: "dev-user-001", weight_kg: 90.5, recorded_at: "2026-02-15", delta_kg: 0.8 },
  { id: "e4", user_id: "dev-user-001", weight_kg: 89.8, recorded_at: "2026-02-22", delta_kg: 0.7 },
  { id: "e5", user_id: "dev-user-001", weight_kg: 88.9, recorded_at: "2026-03-01", delta_kg: 0.9 },
];

export const DEV_BURN_UNITS = [
  { id: "b1", user_id: "dev-user-001", weight_entry_id: "e2", kg_amount: 0.7, status: "submitted_individual", created_at: "2026-02-08" },
  { id: "b2", user_id: "dev-user-001", weight_entry_id: "e3", kg_amount: 0.8, status: "submitted_individual", created_at: "2026-02-15" },
  { id: "b3", user_id: "dev-user-001", weight_entry_id: "e4", kg_amount: 0.7, status: "unsubmitted", created_at: "2026-02-22" },
  { id: "b4", user_id: "dev-user-001", weight_entry_id: "e5", kg_amount: 0.9, status: "unsubmitted", created_at: "2026-03-01" },
];
