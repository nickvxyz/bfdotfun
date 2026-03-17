import { NextRequest, NextResponse } from "next/server";

import { IS_DEV_MODE } from "@/lib/dev";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (IS_DEV_MODE) {
    return NextResponse.json({ error: "Not available in dev mode" }, { status: 404 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: team, error: teamError } = await supabase
    .from("pro_groups")
    .select("id, slug, name, description, type, total_kg_burned, total_kg_submitted, member_count, owner_id")
    .eq("slug", slug)
    .maybeSingle();

  if (teamError) return NextResponse.json({ error: teamError.message }, { status: 500 });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // Fetch owner info
  const { data: owner } = await supabase
    .from("users")
    .select("id, display_name, wallet_address")
    .eq("id", team.owner_id)
    .maybeSingle();

  const ownerName = owner?.display_name || (owner?.wallet_address ? `${owner.wallet_address.slice(0, 6)}...${owner.wallet_address.slice(-4)}` : "Unknown");

  // Fetch active members with user info
  const { data: memberships } = await supabase
    .from("team_memberships")
    .select("id, user_id, status, requested_at, resolved_at")
    .eq("team_id", team.id)
    .eq("status", "active");

  const memberUserIds = (memberships || []).map((m: { user_id: string }) => m.user_id);

  let members: Array<{
    user_id: string;
    display_name: string;
    starting_weight: number | null;
    goal_weight: number | null;
    total_burned: number;
    last_weight: number | null;
    joined_at: string | null;
  }> = [];

  if (memberUserIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, display_name, wallet_address, starting_weight, goal_weight")
      .in("id", memberUserIds);

    // Get latest weight entry for each member
    const { data: weightEntries } = await supabase
      .from("weight_entries")
      .select("user_id, weight_kg, recorded_at")
      .in("user_id", memberUserIds)
      .order("recorded_at", { ascending: false });

    // Get total burned per member
    const { data: burnUnits } = await supabase
      .from("burn_units")
      .select("user_id, kg_amount")
      .in("user_id", memberUserIds);

    const latestWeightMap = new Map<string, number>();
    for (const entry of weightEntries || []) {
      if (!latestWeightMap.has(entry.user_id)) {
        latestWeightMap.set(entry.user_id, Number(entry.weight_kg));
      }
    }

    const burnedMap = new Map<string, number>();
    for (const bu of burnUnits || []) {
      burnedMap.set(bu.user_id, (burnedMap.get(bu.user_id) || 0) + Number(bu.kg_amount));
    }

    const membershipMap = new Map(
      (memberships || []).map((m: { user_id: string; resolved_at: string | null }) => [m.user_id, m.resolved_at]),
    );

    const userMap = new Map(
      (users || []).map((u: { id: string; display_name: string | null; wallet_address: string; starting_weight: number | null; goal_weight: number | null }) => [u.id, u]),
    );

    members = memberUserIds.map((uid: string) => {
      const u = userMap.get(uid);
      return {
        user_id: uid,
        display_name: u?.display_name || (u?.wallet_address ? `${u.wallet_address.slice(0, 6)}...${u.wallet_address.slice(-4)}` : "Unknown"),
        starting_weight: u?.starting_weight ?? null,
        goal_weight: u?.goal_weight ?? null,
        total_burned: burnedMap.get(uid) || 0,
        last_weight: latestWeightMap.get(uid) ?? null,
        joined_at: membershipMap.get(uid) ?? null,
      };
    });
  }

  return NextResponse.json({
    team: { ...team, owner_name: ownerName },
    members,
  });
}
