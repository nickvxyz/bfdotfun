import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { IS_DEV_MODE, DEV_CHALLENGES, DEV_PARTICIPATION } from "@/lib/dev";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { invite_code } = body as { invite_code?: string };

  if (IS_DEV_MODE) {
    const challenge = DEV_CHALLENGES.find((ch) => ch.slug === slug);
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

    const alreadyJoined = DEV_PARTICIPATION.some(
      (p) => p.challenge_id === challenge.id && p.user_id === "dev-user-001",
    );
    if (alreadyJoined) {
      return NextResponse.json({ error: "Already a participant" }, { status: 409 });
    }

    const participant = {
      id: `cp-${Date.now()}`,
      challenge_id: challenge.id,
      user_id: "dev-user-001",
      kg_burned: 0,
      entry_count: 0,
      reward_usdc: null,
      reward_claimed: false,
      joined_at: new Date().toISOString(),
    };
    DEV_PARTICIPATION.push(participant);
    return NextResponse.json({ participant }, { status: 201 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (challengeError) return NextResponse.json({ error: challengeError.message }, { status: 500 });
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  if (challenge.status !== "active") {
    return NextResponse.json({ error: "Challenge is not active" }, { status: 400 });
  }

  // Check not already a participant
  const { data: existing } = await supabase
    .from("challenge_participants")
    .select("id")
    .eq("challenge_id", challenge.id)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Already a participant" }, { status: 409 });

  // Check eligibility: min weight entries and min positive deltas
  const { count: entryCount } = await supabase
    .from("weight_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId);

  if ((entryCount ?? 0) < challenge.min_entries) {
    return NextResponse.json(
      { error: `You need at least ${challenge.min_entries} weight entries to join` },
      { status: 400 },
    );
  }

  const { count: positiveDeltaCount } = await supabase
    .from("weight_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId)
    .gt("delta_kg", 0);

  if ((positiveDeltaCount ?? 0) < challenge.min_positive_deltas) {
    return NextResponse.json(
      { error: `You need at least ${challenge.min_positive_deltas} positive weight loss entries to join` },
      { status: 400 },
    );
  }

  // Visibility gate
  if (challenge.visibility === "private") {
    const { data: user } = await supabase
      .from("users")
      .select("verified_email_domain")
      .eq("id", session.userId)
      .maybeSingle();

    if (!user?.verified_email_domain || user.verified_email_domain !== challenge.email_domain) {
      return NextResponse.json(
        { error: `This challenge requires a verified @${challenge.email_domain} email` },
        { status: 403 },
      );
    }
  }

  if (challenge.visibility === "invite_only") {
    if (!invite_code) {
      return NextResponse.json({ error: "Invite code required" }, { status: 400 });
    }

    const { data: code } = await supabase
      .from("challenge_invite_codes")
      .select("*")
      .eq("challenge_id", challenge.id)
      .eq("code", invite_code)
      .maybeSingle();

    if (!code) return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });

    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite code has expired" }, { status: 400 });
    }

    if (code.use_count >= code.max_uses) {
      return NextResponse.json({ error: "Invite code has reached its usage limit" }, { status: 400 });
    }

    // Atomic increment: only succeeds if use_count hasn't changed (prevents race condition)
    const { error: incrementError } = await supabase
      .from("challenge_invite_codes")
      .update({ use_count: code.use_count + 1 })
      .eq("id", code.id)
      .eq("use_count", code.use_count);

    if (incrementError) {
      return NextResponse.json({ error: "Failed to use invite code. Try again." }, { status: 409 });
    }
  }

  const { data: participant, error: insertError } = await supabase
    .from("challenge_participants")
    .insert({
      challenge_id: challenge.id,
      user_id: session.userId,
      invite_code: invite_code ?? null,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Already a participant" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ participant }, { status: 201 });
}
