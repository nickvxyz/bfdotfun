import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { IS_DEV_MODE } from "@/lib/dev";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (IS_DEV_MODE) {
    return NextResponse.json({ error: "Not available in dev mode" }, { status: 400 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: team } = await supabase
    .from("pro_groups")
    .select("id, owner_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // Owner cannot leave their own team
  if (team.owner_id === session.userId) {
    return NextResponse.json({ error: "Team owner cannot leave. Transfer ownership first." }, { status: 400 });
  }

  // Find active membership
  const { data: membership } = await supabase
    .from("team_memberships")
    .select("id, status")
    .eq("team_id", team.id)
    .eq("user_id", session.userId)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not an active member of this team" }, { status: 400 });
  }

  // Update status to left — trigger handles group_id + member_count
  const { error } = await supabase
    .from("team_memberships")
    .update({ status: "left" })
    .eq("id", membership.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
