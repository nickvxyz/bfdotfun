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

  if (!user?.group_id) {
    return NextResponse.json({ team: null });
  }

  const { data: team } = await supabase
    .from("pro_groups")
    .select("id, slug, name, description, type, total_kg_burned, total_kg_submitted, member_count, owner_id")
    .eq("id", user.group_id)
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ team: null });
  }

  const { data: membership } = await supabase
    .from("team_memberships")
    .select("id, status, requested_at, resolved_at")
    .eq("team_id", team.id)
    .eq("user_id", session.userId)
    .maybeSingle();

  return NextResponse.json({ team, membership });
}
