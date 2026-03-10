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
  height_cm: 180,
  body_fat_pct: 22,
  unit_pref: "kg",
  group_id: null,
  has_used_retrospective: false,
};

export interface DevChallenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  creator_id: string;
  visibility: "public" | "private" | "invite_only";
  email_domain: string | null;
  starts_at: string;
  ends_at: string;
  claim_deadline: string;
  prize_pool_usdc: number;
  pool_tx_hash: string | null;
  contract_challenge_id: number | null;
  merkle_root: string | null;
  status: "draft" | "active" | "ended" | "finalized" | "cancelled";
  min_entries: number;
  min_positive_deltas: number;
  participant_count: number;
  total_kg_burned: number;
  created_at: string;
}

export interface DevParticipation {
  id: string;
  challenge_id: string;
  user_id: string;
  kg_burned: number;
  entry_count: number;
  reward_usdc: number | null;
  reward_claimed: boolean;
  joined_at: string;
}

const now = new Date();
const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
const oneMonthFromNow = new Date(now.getTime() + 30 * 86400000);
const twoMonthsFromNow = new Date(now.getTime() + 60 * 86400000);
const threeMonthsFromNow = new Date(now.getTime() + 90 * 86400000);

export const DEV_CHALLENGES: DevChallenge[] = [
  {
    id: "c-001",
    slug: "march-burn",
    title: "March Burn Challenge",
    description: "Burn the most fat this March! Top burners split the prize pool.",
    creator_id: "dev-user-002",
    visibility: "public",
    email_domain: null,
    starts_at: oneWeekAgo.toISOString(),
    ends_at: oneMonthFromNow.toISOString(),
    claim_deadline: twoMonthsFromNow.toISOString(),
    prize_pool_usdc: 5000,
    pool_tx_hash: "0xdev-pool-001",
    contract_challenge_id: 1,
    merkle_root: null,
    status: "active",
    min_entries: 3,
    min_positive_deltas: 1,
    participant_count: 23,
    total_kg_burned: 45.3,
    created_at: oneWeekAgo.toISOString(),
  },
  {
    id: "c-002",
    slug: "coinbase-wellness",
    title: "Coinbase Q1 Wellness",
    description: "Internal Coinbase wellness challenge. Email verification required.",
    creator_id: "dev-user-003",
    visibility: "private",
    email_domain: "coinbase.com",
    starts_at: oneWeekAgo.toISOString(),
    ends_at: oneMonthFromNow.toISOString(),
    claim_deadline: twoMonthsFromNow.toISOString(),
    prize_pool_usdc: 10000,
    pool_tx_hash: "0xdev-pool-002",
    contract_challenge_id: 2,
    merkle_root: null,
    status: "active",
    min_entries: 5,
    min_positive_deltas: 2,
    participant_count: 89,
    total_kg_burned: 234.8,
    created_at: oneWeekAgo.toISOString(),
  },
  {
    id: "c-003",
    slug: "summer-shred",
    title: "Summer Shred 2026",
    description: "Get ready for summer! Invite-only challenge.",
    creator_id: "dev-user-001",
    visibility: "invite_only",
    email_domain: null,
    starts_at: oneMonthFromNow.toISOString(),
    ends_at: twoMonthsFromNow.toISOString(),
    claim_deadline: threeMonthsFromNow.toISOString(),
    prize_pool_usdc: 2500,
    pool_tx_hash: "0xdev-pool-003",
    contract_challenge_id: 3,
    merkle_root: null,
    status: "draft",
    min_entries: 3,
    min_positive_deltas: 1,
    participant_count: 0,
    total_kg_burned: 0,
    created_at: now.toISOString(),
  },
];

export const DEV_PARTICIPATION: DevParticipation[] = [
  {
    id: "cp-001",
    challenge_id: "c-001",
    user_id: "dev-user-001",
    kg_burned: 3.2,
    entry_count: 5,
    reward_usdc: null,
    reward_claimed: false,
    joined_at: oneWeekAgo.toISOString(),
  },
];
