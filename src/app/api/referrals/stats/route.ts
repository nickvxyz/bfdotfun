import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get user's referral code
  const { data: referralCode } = await supabase
    .from("referral_codes")
    .select("id, code")
    .eq("user_id", session.userId)
    .maybeSingle();

  if (!referralCode) {
    return NextResponse.json({
      code: null,
      link: null,
      referral_count: 0,
      referees: [],
      total_earned_usdc: "0.00",
      pending_rewards_usdc: "0.00",
    });
  }

  // Get referrals with referee info
  const { data: referrals } = await supabase
    .from("referrals")
    .select("referee_id, created_at")
    .eq("referrer_id", session.userId)
    .order("created_at", { ascending: false });

  const refereeIds = (referrals || []).map((r) => r.referee_id);

  let referees: Array<{
    display_name: string | null;
    wallet_address: string;
    joined_at: string;
  }> = [];

  if (refereeIds.length > 0) {
    const { data: refereeUsers } = await supabase
      .from("users")
      .select("id, display_name, wallet_address")
      .in("id", refereeIds);

    const userMap = new Map(
      (refereeUsers || []).map((u) => [u.id, u]),
    );

    referees = (referrals || []).map((r) => {
      const user = userMap.get(r.referee_id);
      return {
        display_name: user?.display_name ?? null,
        wallet_address: user?.wallet_address ?? "",
        joined_at: r.created_at,
      };
    });
  }

  // Get rewards
  const { data: rewards } = await supabase
    .from("referral_rewards")
    .select("reward_usdc, status")
    .eq("referrer_id", session.userId);

  const totalEarned = (rewards || []).reduce(
    (sum, r) => sum + Number(r.reward_usdc),
    0,
  );

  const pendingRewards = (rewards || [])
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + Number(r.reward_usdc), 0);

  return NextResponse.json({
    code: referralCode.code,
    link: `https://burnfat.fun/r/${referralCode.code}`,
    referral_count: refereeIds.length,
    referees,
    total_earned_usdc: totalEarned.toFixed(2),
    pending_rewards_usdc: pendingRewards.toFixed(2),
  });
}
