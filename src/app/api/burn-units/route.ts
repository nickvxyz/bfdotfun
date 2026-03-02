import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const IS_DEV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "your-anon-key-here" ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const DEV_BURN_UNITS = [
  { id: "b1", user_id: "dev-user-001", weight_entry_id: "e2", kg_amount: 0.7, status: "submitted_individual", created_at: "2026-02-08" },
  { id: "b2", user_id: "dev-user-001", weight_entry_id: "e3", kg_amount: 0.8, status: "submitted_individual", created_at: "2026-02-15" },
  { id: "b3", user_id: "dev-user-001", weight_entry_id: "e4", kg_amount: 0.7, status: "unsubmitted", created_at: "2026-02-22" },
  { id: "b4", user_id: "dev-user-001", weight_entry_id: "e5", kg_amount: 0.9, status: "unsubmitted", created_at: "2026-03-01" },
];

export async function GET(request: NextRequest) {
  if (IS_DEV) {
    const status = request.nextUrl.searchParams.get("status");
    const units = status
      ? DEV_BURN_UNITS.filter((u) => u.status === status)
      : DEV_BURN_UNITS;
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
