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

  // Verify team ownership
  const { data: team } = await supabase
    .from("pro_groups")
    .select("id, owner_id, total_kg_submitted")
    .eq("slug", slug)
    .maybeSingle();

  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.owner_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden — only the team owner can submit" }, { status: 403 });
  }

  // Rate limit: max 1 team submission per 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentSubmissions } = await supabase
    .from("submissions")
    .select("id")
    .eq("submission_type", "pro_group")
    .eq("group_id", team.id)
    .gte("created_at", twentyFourHoursAgo)
    .limit(1);

  if (recentSubmissions && recentSubmissions.length > 0) {
    return NextResponse.json({ error: "Rate limit — only one team submission per 24 hours" }, { status: 429 });
  }

  // Get active member IDs
  const { data: memberships } = await supabase
    .from("team_memberships")
    .select("user_id")
    .eq("team_id", team.id)
    .eq("status", "active");

  const memberIds = (memberships || []).map((m: { user_id: string }) => m.user_id);

  if (memberIds.length === 0) {
    return NextResponse.json({ error: "No active members" }, { status: 400 });
  }

  // Query pooled burn units
  const { data: pooledUnits } = await supabase
    .from("burn_units")
    .select("id, kg_amount")
    .eq("status", "team_pooled")
    .is("submission_id", null)
    .in("user_id", memberIds);

  if (!pooledUnits || pooledUnits.length === 0) {
    return NextResponse.json({ error: "No unsubmitted burn units available" }, { status: 400 });
  }

  const totalKg = pooledUnits.reduce((sum: number, u: { kg_amount: number }) => sum + Number(u.kg_amount), 0);
  const unitIds = pooledUnits.map((u: { id: string }) => u.id);
  const timestamp = Date.now();

  // Create submission
  const { data: submission, error: subError } = await supabase
    .from("submissions")
    .insert({
      submitter_id: session.userId,
      kg_total: totalKg,
      usdc_amount: 0,
      tx_hash: `team-submit-${team.id}-${timestamp}`,
      submission_type: "pro_group",
      group_id: team.id,
    })
    .select("id")
    .single();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });

  // Update burn units — only those still team_pooled (atomic guard against race condition)
  const { error: updateError, count: updatedCount } = await supabase
    .from("burn_units")
    .update({ status: "submitted_via_pro", submission_id: submission.id })
    .in("id", unitIds)
    .eq("status", "team_pooled")
    .is("submission_id", null);

  if (updateError) console.error("Failed to update burn units:", updateError);
  if (updatedCount === 0) {
    // Race condition: another submission claimed the units first — rollback
    await supabase.from("submissions").delete().eq("id", submission.id);
    return NextResponse.json({ error: "Burns were already submitted — try again" }, { status: 409 });
  }

  // Update team total_kg_submitted
  const { error: teamUpdateError } = await supabase
    .from("pro_groups")
    .update({ total_kg_submitted: Number(team.total_kg_submitted) + totalKg })
    .eq("id", team.id);

  if (teamUpdateError) console.error("Failed to update team total:", teamUpdateError);

  // Activity feed entry — best-effort
  try {
    await supabase.from("activity_feed").insert({
      user_id: session.userId,
      type: "fat_burned",
      payload: { kg_total: totalKg, submission_type: "pro_group" },
    });
  } catch { /* non-blocking */ }

  return NextResponse.json({
    submission: {
      id: submission.id,
      kg_total: totalKg,
      unit_count: unitIds.length,
    },
  });
}
