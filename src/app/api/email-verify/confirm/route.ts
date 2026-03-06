import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { IS_DEV_MODE } from "@/lib/dev";

async function getSession(): Promise<{ userId: string } | null> {
  const c = await cookies();
  const raw = c.get("bf_session")?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.userId || typeof parsed.userId !== "string") return null;
    return parsed;
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { email, code } = body as { email?: string; code?: string };

  if (!email || !code) {
    return NextResponse.json({ error: "email and code are required" }, { status: 400 });
  }

  if (IS_DEV_MODE) {
    if (code === "123456") {
      const domain = email.split("@")[1].toLowerCase();
      return NextResponse.json({ verified: true, domain });
    }
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  // Look up the latest unverified, unexpired verification for this user+email
  const { data: verification, error: fetchError } = await supabase
    .from("email_verifications")
    .select("*")
    .eq("user_id", session.userId)
    .eq("email", email.toLowerCase())
    .eq("verified", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!verification) {
    return NextResponse.json(
      { error: "No valid verification found. Request a new code." },
      { status: 404 },
    );
  }

  if (verification.code !== code) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // Mark verification as verified
  const { error: markError } = await supabase
    .from("email_verifications")
    .update({ verified: true })
    .eq("id", verification.id);

  if (markError) return NextResponse.json({ error: markError.message }, { status: 500 });

  const domain = verification.domain;

  // Update user's verified email fields
  const { error: userError } = await supabase
    .from("users")
    .update({ verified_email: email.toLowerCase(), verified_email_domain: domain })
    .eq("id", session.userId);

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  return NextResponse.json({ verified: true, domain });
}
