import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: referralCode } = await supabase
    .from("referral_codes")
    .select("id, user_id")
    .eq("code", code.toLowerCase())
    .maybeSingle();

  if (!referralCode) {
    return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
  }

  // Get referrer display name
  const { data: referrer } = await supabase
    .from("users")
    .select("display_name, wallet_address")
    .eq("id", referralCode.user_id)
    .maybeSingle();

  const displayName = referrer?.display_name
    || (referrer?.wallet_address
      ? `${referrer.wallet_address.slice(0, 6)}...${referrer.wallet_address.slice(-4)}`
      : "Someone");

  return NextResponse.json({
    valid: true,
    referrer_display_name: displayName,
  });
}
