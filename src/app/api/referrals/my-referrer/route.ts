import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ referrer_wallet: null });

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: referral } = await supabase
    .from("referrals")
    .select("referrer_id")
    .eq("referee_id", session.userId)
    .maybeSingle();

  if (!referral?.referrer_id) {
    return NextResponse.json({ referrer_wallet: null });
  }

  const { data: referrer } = await supabase
    .from("users")
    .select("wallet_address")
    .eq("id", referral.referrer_id)
    .maybeSingle();

  return NextResponse.json({ referrer_wallet: referrer?.wallet_address ?? null });
}
