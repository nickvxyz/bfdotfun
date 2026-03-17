import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { IS_DEV_MODE } from "@/lib/dev";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (IS_DEV_MODE) {
    return NextResponse.json({ team: null });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("group_id")
    .eq("id", session.userId)
    .maybeSingle();

  // Check for any pending membership (even if group_id not set yet)
  const { data: pendingMembership } = await supabase
    .from("team_memberships")
    .select("id, team_id, status, requested_at, resolved_at")
    .eq("user_id", session.userId)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (pendingMembership) {
    // Return the pending team info
    const { data: pendingTeam } = await supabase
      .from("pro_groups")
      .select("id, slug, name, description, type, total_kg_burned, total_kg_submitted, member_count, owner_id")
      .eq("id", pendingMembership.team_id)
      .maybeSingle();

    return NextResponse.json({ team: pendingTeam, membership: pendingMembership });
  }

  if (!user?.group_id) {
    return NextResponse.json({ team: null, membership: null });
  }

  const { data: team } = await supabase
    .from("pro_groups")
    .select("id, slug, name, description, type, total_kg_burned, total_kg_submitted, member_count, owner_id")
    .eq("id", user.group_id)
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ team: null, membership: null });
  }

  const { data: membership } = await supabase
    .from("team_memberships")
    .select("id, status, requested_at, resolved_at")
    .eq("team_id", team.id)
    .eq("user_id", session.userId)
    .maybeSingle();

  return NextResponse.json({ team, membership });
}
