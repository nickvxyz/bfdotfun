import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const IS_DEV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "your-anon-key-here" ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (IS_DEV) {
    return NextResponse.json({
      user: {
        id: "dev-user-001",
        wallet_address: "0xd3v0000000000000000000000000000000000001",
        display_name: body.display_name ?? "Dev User",
        role: "individual",
        starting_weight: body.starting_weight ?? 92,
        goal_weight: body.goal_weight ?? 78,
        height_cm: body.height_cm ?? 178,
        unit_pref: body.unit_pref ?? "kg",
        group_id: null,
      },
    });
  }

  const cookieStore = await cookies();
  const sessionRaw = cookieStore.get("bf_session")?.value;
  if (!sessionRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = JSON.parse(sessionRaw);

  const allowed = ["display_name", "starting_weight", "goal_weight", "height_cm", "unit_pref"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", session.userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user });
}
