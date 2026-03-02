import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyMessage } from "viem";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { address, signature, message } = await request.json();

    if (!address || !signature || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify nonce from cookie
    const cookieStore = await cookies();
    const storedNonce = cookieStore.get("auth_nonce")?.value;
    if (!storedNonce || !message.includes(storedNonce)) {
      return NextResponse.json({ error: "Invalid nonce" }, { status: 401 });
    }

    // Verify signature
    const valid = await verifyMessage({
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
    const supabase = await createClient();
    const walletLower = address.toLowerCase();

    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", walletLower)
      .single();

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
    }

    // Set session cookie (simple JWT-like approach using wallet address)
    cookieStore.set("bf_session", JSON.stringify({ userId: user.id, wallet: walletLower }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
