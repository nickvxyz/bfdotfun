import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { IS_DEV_MODE, DEV_CHALLENGES, DEV_PARTICIPATION } from "@/lib/dev";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const session = await getSession();

  if (IS_DEV_MODE) {
    const challenge = DEV_CHALLENGES.find((ch) => ch.slug === slug);
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

    const participation = DEV_PARTICIPATION.find(
      (p) => p.challenge_id === challenge.id && p.user_id === "dev-user-001",
    ) ?? null;

    return NextResponse.json({ challenge, participation });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: challenge, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  let participation = null;
  if (session) {
    const { data } = await supabase
      .from("challenge_participants")
      .select("*")
      .eq("challenge_id", challenge.id)
      .eq("user_id", session.userId)
      .maybeSingle();
    participation = data;
  }

  return NextResponse.json({ challenge, participation });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (IS_DEV_MODE) {
    return NextResponse.json({ error: "Not available in dev mode" }, { status: 501 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: challenge, error: fetchError } = await supabase
    .from("challenges")
    .select("id, creator_id")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  if (challenge.creator_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const allowedFields: Record<string, unknown> = {};
  if (body.title !== undefined) allowedFields.title = body.title;
  if (body.description !== undefined) allowedFields.description = body.description;
  if (body.merkle_root !== undefined) allowedFields.merkle_root = body.merkle_root;
  if (body.status !== undefined) allowedFields.status = body.status;

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("challenges")
    .update(allowedFields)
    .eq("id", challenge.id)
    .select()
    .maybeSingle();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ challenge: updated });
}
