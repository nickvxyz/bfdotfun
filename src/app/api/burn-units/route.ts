import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { IS_DEV_MODE } from "@/lib/dev";

export async function GET(request: NextRequest) {
  if (IS_DEV_MODE) {
    // Import the shared in-memory store from weight-entries
    const { devBurnUnits } = await import("@/app/api/weight-entries/route");
    const status = request.nextUrl.searchParams.get("status");
    const units = status
      ? devBurnUnits.filter((u) => u.status === status)
      : devBurnUnits;
    return NextResponse.json({ burn_units: units });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

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
