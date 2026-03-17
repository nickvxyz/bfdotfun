import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { IS_DEV_MODE } from "@/lib/dev";

export async function POST(
  request: NextRequest,
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

  // Check user doesn't already have a team
  const { data: currentUser } = await supabase
    .from("users")
    .select("group_id")
    .eq("id", session.userId)
    .maybeSingle();

  if (currentUser?.group_id) {
    return NextResponse.json({ error: "You are already in a team. Leave your current team first." }, { status: 400 });
  }

  // Find team
  const { data: team } = await supabase
    .from("pro_groups")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // Check for existing membership
  const { data: existingMembership } = await supabase
    .from("team_memberships")
    .select("id, status")
    .eq("team_id", team.id)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (existingMembership) {
    if (existingMembership.status === "active") {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }
    if (existingMembership.status === "pending") {
      return NextResponse.json({ error: "Request already pending" }, { status: 409 });
    }
  }

  // Optional invite code validation
  const body = await request.json().catch(() => ({}));
  let inviteCode: string | null = null;

  if (body.invite_code) {
    const { data: code, error: codeError } = await supabase
      .from("team_invite_codes")
      .select("id, code, max_uses, use_count, expires_at")
      .eq("code", body.invite_code)
      .eq("team_id", team.id)
      .maybeSingle();

    if (codeError || !code) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }

    if (code.use_count >= code.max_uses) {
      return NextResponse.json({ error: "Invite code has been fully used" }, { status: 400 });
    }

    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite code has expired" }, { status: 400 });
    }

    // Increment use count
    await supabase
      .from("team_invite_codes")
      .update({ use_count: code.use_count + 1 })
      .eq("id", code.id);

    inviteCode = code.code;
  }

  // If user had a previous rejected/left membership, update it
  if (existingMembership && (existingMembership.status === "rejected" || existingMembership.status === "left")) {
    const { error: updateError } = await supabase
      .from("team_memberships")
      .update({
        status: "pending",
        invite_code: inviteCode,
        requested_at: new Date().toISOString(),
        resolved_at: null,
      })
      .eq("id", existingMembership.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({ membership: { status: "pending" } });
  }

  // Insert new membership
  const { error: insertError } = await supabase
    .from("team_memberships")
    .insert({
      team_id: team.id,
      user_id: session.userId,
      status: "pending",
      invite_code: inviteCode,
    });

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ membership: { status: "pending" } });
}
