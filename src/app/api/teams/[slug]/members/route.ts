import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { IS_DEV_MODE } from "@/lib/dev";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (IS_DEV_MODE) {
    return NextResponse.json({ members: [] });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: team } = await supabase
    .from("pro_groups")
    .select("id, owner_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.owner_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: memberships, error } = await supabase
    .from("team_memberships")
    .select("id, user_id, status, invite_code, requested_at, resolved_at")
    .eq("team_id", team.id)
    .order("requested_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch user info for all members
  const userIds = (memberships || []).map((m: { user_id: string }) => m.user_id);
  const { data: users } = await supabase
    .from("users")
    .select("id, display_name, wallet_address")
    .in("id", userIds);

  const userMap = new Map(
    (users || []).map((u: { id: string; display_name: string | null; wallet_address: string }) => [
      u.id,
      u.display_name || `${u.wallet_address.slice(0, 6)}...${u.wallet_address.slice(-4)}`,
    ]),
  );

  // Get burn totals per member
  const { data: burnUnits } = await supabase
    .from("burn_units")
    .select("user_id, kg_amount")
    .in("user_id", userIds);

  const burnedMap = new Map<string, number>();
  for (const bu of burnUnits || []) {
    burnedMap.set(bu.user_id, (burnedMap.get(bu.user_id) || 0) + Number(bu.kg_amount));
  }

  const result = (memberships || []).map((m: { id: string; user_id: string; status: string; invite_code: string | null; requested_at: string; resolved_at: string | null }) => ({
    ...m,
    display_name: userMap.get(m.user_id) || "Unknown",
    total_burned: burnedMap.get(m.user_id) || 0,
  }));

  return NextResponse.json({ members: result });
}
