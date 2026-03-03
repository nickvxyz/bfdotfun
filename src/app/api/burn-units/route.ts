import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const IS_DEV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "your-anon-key-here" ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  if (IS_DEV) {
    // Import the shared in-memory store from weight-entries
    const { devBurnUnits } = await import("@/app/api/weight-entries/route");
    const status = request.nextUrl.searchParams.get("status");
    const units = status
      ? devBurnUnits.filter((u) => u.status === status)
      : devBurnUnits;
    return NextResponse.json({ burn_units: units });
  }

  const cookieStore = await cookies();
  const sessionRaw = cookieStore.get("bf_session")?.value;
  if (!sessionRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = JSON.parse(sessionRaw);
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const status = request.nextUrl.searchParams.get("status");

  let query = supabase
    .from("burn_units")
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ burn_units: data });
}
