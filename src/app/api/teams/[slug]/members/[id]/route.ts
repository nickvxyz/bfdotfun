import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { IS_DEV_MODE } from "@/lib/dev";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (IS_DEV_MODE) {
    return NextResponse.json({ error: "Not available in dev mode" }, { status: 400 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  // Verify team ownership
  const { data: team } = await supabase
    .from("pro_groups")
    .select("id, owner_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.owner_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await request.json();

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  // Fetch membership
  const { data: membership } = await supabase
    .from("team_memberships")
    .select("id, status, team_id")
    .eq("id", id)
    .eq("team_id", team.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Membership not found" }, { status: 404 });
  }

  if (membership.status !== "pending") {
    return NextResponse.json({ error: `Cannot ${action} — membership is ${membership.status}` }, { status: 400 });
  }

  const newStatus = action === "approve" ? "active" : "rejected";

  // Update — trigger handles group_id + member_count for approvals
  const { error } = await supabase
    .from("team_memberships")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ membership: { id, status: newStatus } });
}
