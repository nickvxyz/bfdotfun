import { NextRequest, NextResponse } from "next/server";

import { IS_DEV_MODE, DEV_CHALLENGES, DEV_PARTICIPATION } from "@/lib/dev";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);

  if (IS_DEV_MODE) {
    const challenge = DEV_CHALLENGES.find((ch) => ch.slug === slug);
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

    const entries = DEV_PARTICIPATION.filter((p) => p.challenge_id === challenge.id).map((p) => ({
      id: p.id,
      display_name: "Dev User",
      delta_kg: p.kg_burned,
      recorded_at: p.joined_at,
    }));

    return NextResponse.json({ entries });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (challengeError) return NextResponse.json({ error: challengeError.message }, { status: 500 });
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  // Join challenge_weight_entries → weight_entries → users
  const { data: rows, error } = await supabase
    .from("challenge_weight_entries")
    .select(`
      id,
      delta_kg,
      created_at,
      weight_entries (
        recorded_at
      ),
      challenge_participants (
        users (
          display_name
        )
      )
    `)
    .eq("challenge_id", challenge.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entries = (rows ?? []).map((row) => {
    const participant = Array.isArray(row.challenge_participants)
      ? row.challenge_participants[0]
      : row.challenge_participants;
    const user = participant && (Array.isArray(participant.users) ? participant.users[0] : participant.users);
    const weightEntry = Array.isArray(row.weight_entries) ? row.weight_entries[0] : row.weight_entries;

    return {
      id: row.id,
      display_name: user?.display_name ?? "Anonymous",
      delta_kg: row.delta_kg,
      recorded_at: weightEntry?.recorded_at ?? row.created_at,
    };
  });

  return NextResponse.json({ entries });
}
