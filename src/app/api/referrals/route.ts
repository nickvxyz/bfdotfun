import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";

const REFERRAL_CHARSET = "abcdefghjkmnpqrstuvwxyz23456789";
const REFERRAL_CODE_LENGTH = 6;

function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += REFERRAL_CHARSET[Math.floor(Math.random() * REFERRAL_CHARSET.length)];
  }
  return code;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Check if user already has a referral code
  const { data: existingCode } = await supabase
    .from("referral_codes")
    .select("id, code")
    .eq("user_id", session.userId)
    .maybeSingle();

  let code: string;
  let codeId: string;

  if (existingCode) {
    code = existingCode.code;
    codeId = existingCode.id;
  } else {
    // Generate a unique code with retry
    let newCode = generateReferralCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { data: conflict } = await supabase
        .from("referral_codes")
        .select("id")
        .eq("code", newCode)
        .maybeSingle();

      if (!conflict) break;
      newCode = generateReferralCode();
      attempts++;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("referral_codes")
      .insert({ user_id: session.userId, code: newCode })
      .select("id, code")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    code = inserted.code;
    codeId = inserted.id;
  }

  // Count referrals
  const { count: referralCount } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referral_code_id", codeId);

  // Sum earned rewards
  const { data: rewards } = await supabase
    .from("referral_rewards")
    .select("reward_usdc")
    .eq("referrer_id", session.userId);

  const totalEarned = (rewards || []).reduce(
    (sum, r) => sum + Number(r.reward_usdc),
    0,
  );

  return NextResponse.json({
    code,
    link: `https://burnfat.fun/r/${code}`,
    referral_count: referralCount || 0,
    total_earned: totalEarned.toFixed(2),
  });
}
