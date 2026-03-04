import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { IS_DEV_MODE } from "@/lib/dev";

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (IS_DEV_MODE) {
    const { DEV_USER } = await import("@/lib/dev");
    // Merge submitted fields into DEV_USER so the response reflects what was saved
    const updatedUser = {
      ...DEV_USER,
      display_name: body.display_name !== undefined ? body.display_name : DEV_USER.display_name,
      starting_weight: body.starting_weight !== undefined ? body.starting_weight : DEV_USER.starting_weight,
      goal_weight: body.goal_weight !== undefined ? body.goal_weight : DEV_USER.goal_weight,
      height_cm: body.height_cm !== undefined ? body.height_cm : DEV_USER.height_cm,
      body_fat_pct: body.body_fat_pct !== undefined ? body.body_fat_pct : DEV_USER.body_fat_pct,
      unit_pref: body.unit_pref !== undefined ? body.unit_pref : DEV_USER.unit_pref,
    };
    return NextResponse.json({ user: updatedUser });
  }

  const cookieStore = await cookies();
  const sessionRaw = cookieStore.get("bf_session")?.value;
  if (!sessionRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = JSON.parse(sessionRaw);

  const allowed = ["display_name", "starting_weight", "goal_weight", "height_cm", "body_fat_pct", "unit_pref"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", session.userId)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}
