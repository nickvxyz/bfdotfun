import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { IS_DEV_MODE, DEV_CHALLENGES } from "@/lib/dev";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const visibilityFilter = searchParams.get("visibility");

  if (IS_DEV_MODE) {
    let challenges = [...DEV_CHALLENGES];
    if (statusFilter) challenges = challenges.filter((c) => c.status === statusFilter);
    if (visibilityFilter) challenges = challenges.filter((c) => c.visibility === visibilityFilter);
    return NextResponse.json({ challenges });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  let query = supabase
    .from("challenges")
    .select("id, slug, title, description, visibility, status, participant_count, total_kg_burned, prize_pool_usdc, starts_at, ends_at, claim_deadline, creator_id")
    .order("created_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);
  if (visibilityFilter) query = query.eq("visibility", visibilityFilter);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ challenges: data });
}

export async function POST(request: NextRequest) {
  if (IS_DEV_MODE) {
    return NextResponse.json({ error: "Not available in dev mode" }, { status: 501 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    slug,
    title,
    description,
    visibility,
    email_domain,
    starts_at,
    ends_at,
    claim_deadline,
    prize_pool_usdc,
    pool_tx_hash,
    contract_challenge_id,
    min_entries,
    min_positive_deltas,
  } = body;

  if (!slug || !title || !visibility || !starts_at || !ends_at || !claim_deadline) {
    return NextResponse.json(
      { error: "Missing required fields: slug, title, visibility, starts_at, ends_at, claim_deadline" },
      { status: 400 },
    );
  }

  // Validate slug format (only lowercase alphanumeric + hyphens, 2-64 chars)
  if (!/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug must be 2-64 characters, lowercase letters/numbers/hyphens only" },
      { status: 400 },
    );
  }

  if (!["public", "private", "invite_only"].includes(visibility)) {
    return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: challenge, error } = await supabase
    .from("challenges")
    .insert({
      slug,
      title,
      description: description ?? null,
      creator_id: session.userId,
      visibility,
      email_domain: email_domain ?? null,
      starts_at,
      ends_at,
      claim_deadline,
      prize_pool_usdc: prize_pool_usdc ?? 0,
      pool_tx_hash: pool_tx_hash ?? null,
      contract_challenge_id: contract_challenge_id ?? null,
      min_entries: min_entries ?? 3,
      min_positive_deltas: min_positive_deltas ?? 1,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ challenge }, { status: 201 });
}
