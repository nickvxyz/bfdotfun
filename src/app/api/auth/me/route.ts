import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { IS_DEV_MODE } from "@/lib/dev";

export async function GET() {
  if (IS_DEV_MODE) {
    const { DEV_USER } = await import("@/lib/dev");
    return NextResponse.json({ user: DEV_USER });
  }

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.userId)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
