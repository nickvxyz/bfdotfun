import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { IS_DEV_MODE } from "@/lib/dev";

export async function GET() {
  if (IS_DEV_MODE) {
    return NextResponse.json({ teams: [], can_create: true });
  }

  const session = await getSession();
  const creatorId = process.env.TEAM_CREATOR_ID;
  const canCreate = !!(session && creatorId && session.userId === creatorId);

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: teams, error } = await supabase
    .from("pro_groups")
    .select("id, slug, name, description, type, total_kg_burned, total_kg_submitted, member_count, owner_id")
    .order("total_kg_burned", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch owner display names
  const ownerIds = [...new Set((teams || []).map((t: { owner_id: string }) => t.owner_id))];
  const { data: owners } = await supabase
    .from("users")
    .select("id, display_name, wallet_address")
    .in("id", ownerIds);

  const ownerMap = new Map(
    (owners || []).map((o: { id: string; display_name: string | null; wallet_address: string }) => [
      o.id,
      o.display_name || `${o.wallet_address.slice(0, 6)}...${o.wallet_address.slice(-4)}`,
    ]),
  );

  const result = (teams || []).map((t: { id: string; slug: string; name: string; description: string | null; type: string; total_kg_burned: number; total_kg_submitted: number; member_count: number; owner_id: string }) => ({
    ...t,
    owner_name: ownerMap.get(t.owner_id) || "Unknown",
  }));

  return NextResponse.json({ teams: result, can_create: canCreate });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const creatorId = process.env.TEAM_CREATOR_ID;
  if (!creatorId || session.userId !== creatorId) {
    return NextResponse.json({ error: "Forbidden — team creation is restricted" }, { status: 403 });
  }

  if (IS_DEV_MODE) {
    return NextResponse.json({ error: "Not available in dev mode" }, { status: 400 });
  }

  const { name, slug, description, type } = await request.json();

  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "slug must be lowercase alphanumeric with hyphens" }, { status: 400 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from("pro_groups")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  // Create team
  const { data: team, error: teamError } = await supabase
    .from("pro_groups")
    .insert({
      owner_id: session.userId,
      name,
      slug,
      description: description || null,
      type: type || "team",
      subscription_status: "active",
      member_count: 1,
    })
    .select()
    .single();

  if (teamError) return NextResponse.json({ error: teamError.message }, { status: 500 });

  // Add creator as active member
  const { error: memberError } = await supabase
    .from("team_memberships")
    .insert({
      team_id: team.id,
      user_id: session.userId,
      status: "active",
      resolved_at: new Date().toISOString(),
    });

  if (memberError) console.error("Failed to add creator as member:", memberError);

  // Set creator's group_id
  await supabase.from("users").update({ group_id: team.id }).eq("id", session.userId);

  return NextResponse.json({ team }, { status: 201 });
}
