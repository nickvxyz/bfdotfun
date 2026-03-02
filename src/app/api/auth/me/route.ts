import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const IS_DEV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "your-anon-key-here" ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (IS_DEV) {
    return NextResponse.json({
      user: {
        id: "dev-user-001",
        wallet_address: "0xd3v0000000000000000000000000000000000001",
        display_name: "Dev User",
        role: "individual",
        starting_weight: 92,
        goal_weight: 78,
        unit_pref: "kg",
        group_id: null,
      },
    });
  }

  try {
    const cookieStore = await cookies();
    const sessionRaw = cookieStore.get("bf_session")?.value;

    if (!sessionRaw) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = JSON.parse(sessionRaw);
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
