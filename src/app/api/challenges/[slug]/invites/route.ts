import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { IS_DEV_MODE } from "@/lib/dev";

async function getSession() {
  const c = await cookies();
  const raw = c.get("bf_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function generateCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (IS_DEV_MODE) {
    return NextResponse.json({ codes: [] });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id, creator_id")
    .eq("slug", slug)
    .maybeSingle();

  if (challengeError) return NextResponse.json({ error: challengeError.message }, { status: 500 });
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  if (challenge.creator_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: codes, error } = await supabase
    .from("challenge_invite_codes")
    .select("*")
    .eq("challenge_id", challenge.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ codes });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (IS_DEV_MODE) {
    const { count = 1, max_uses = 1 } = await request.json();
    const codes = Array.from({ length: count }, () => ({
      id: `ic-${Date.now()}-${Math.random()}`,
      code: generateCode(),
      max_uses,
      use_count: 0,
      created_at: new Date().toISOString(),
    }));
    return NextResponse.json({ codes }, { status: 201 });
  }

  const { count = 1, max_uses } = await request.json();

  if (!Number.isInteger(count) || count < 1 || count > 100) {
    return NextResponse.json({ error: "count must be an integer between 1 and 100" }, { status: 400 });
  }

  if (max_uses !== undefined && (!Number.isInteger(max_uses) || max_uses < 1)) {
    return NextResponse.json({ error: "max_uses must be a positive integer" }, { status: 400 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id, creator_id")
    .eq("slug", slug)
    .maybeSingle();

  if (challengeError) return NextResponse.json({ error: challengeError.message }, { status: 500 });
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  if (challenge.creator_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const inserts = Array.from({ length: count }, () => ({
    challenge_id: challenge.id,
    code: generateCode(),
    max_uses: max_uses ?? 1,
    created_by: session.userId,
  }));

  const { data: codes, error: insertError } = await supabase
    .from("challenge_invite_codes")
    .insert(inserts)
    .select();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ codes }, { status: 201 });
}
