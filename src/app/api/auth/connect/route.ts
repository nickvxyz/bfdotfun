import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { baseClient } from "@/lib/viem";
import { setSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const { address, signature, message, referral_code } = await request.json();

    if (!address || !signature || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify nonce from cookie — exact message format match
    const cookieStore = await cookies();
    const storedNonce = cookieStore.get("auth_nonce")?.value;
    const expectedMessage = `Sign in to BurnFat.fun\n\nNonce: ${storedNonce}`;
    if (!storedNonce || message !== expectedMessage) {
      return NextResponse.json({ error: "Invalid nonce" }, { status: 401 });
    }

    // Verify signature
    const valid = await baseClient.verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Clear nonce
    cookieStore.delete("auth_nonce");

    // Upsert user in Supabase
    const supabase = createAdminClient();
    const walletLower = address.toLowerCase();

    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", walletLower)
      .maybeSingle();

    let user;
    if (existing) {
      user = existing;
    } else {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          wallet_address: walletLower,
          role: "individual",
          unit_pref: "kg",
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }
      user = newUser;

      // Wire referral if code provided — best-effort
      if (referral_code) {
        try {
          const { data: refCode } = await supabase
            .from("referral_codes")
            .select("id, user_id")
            .eq("code", referral_code)
            .maybeSingle();

          if (refCode) {
            await supabase.from("referrals").insert({
              referrer_id: refCode.user_id,
              referee_id: newUser.id,
              referral_code_id: refCode.id,
            });
          }
        } catch { /* non-blocking */ }
      }
    }

    // Set HMAC-signed session cookie
    await setSession({ userId: user.id, wallet: walletLower });

    return NextResponse.json({ user });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
