import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const IS_DEV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "your-anon-key-here" ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const DEV_ENTRIES = [
  { id: "e1", user_id: "dev-user-001", weight_kg: 92.0, recorded_at: "2026-02-01", delta_kg: 0 },
  { id: "e2", user_id: "dev-user-001", weight_kg: 91.3, recorded_at: "2026-02-08", delta_kg: 0.7 },
  { id: "e3", user_id: "dev-user-001", weight_kg: 90.5, recorded_at: "2026-02-15", delta_kg: 0.8 },
  { id: "e4", user_id: "dev-user-001", weight_kg: 89.8, recorded_at: "2026-02-22", delta_kg: 0.7 },
  { id: "e5", user_id: "dev-user-001", weight_kg: 88.9, recorded_at: "2026-03-01", delta_kg: 0.9 },
];

async function getSession() {
  const c = await cookies();
  const raw = c.get("bf_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET() {
  if (IS_DEV) {
    return NextResponse.json({ entries: DEV_ENTRIES });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weight_entries")
    .select("*")
    .eq("user_id", session.userId)
    .order("recorded_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data });
}

export async function POST(request: NextRequest) {
  if (IS_DEV) {
    const body = await request.json();
    return NextResponse.json({
      entry: {
        id: `e-${Date.now()}`,
        user_id: "dev-user-001",
        weight_kg: body.weight_kg,
        recorded_at: body.recorded_at,
        delta_kg: 0,
      },
    });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { weight_kg, recorded_at } = await request.json();
  if (!weight_kg || !recorded_at) {
    return NextResponse.json({ error: "Missing weight_kg or recorded_at" }, { status: 400 });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: prev } = await supabase
    .from("weight_entries")
    .select("weight_kg")
    .eq("user_id", session.userId)
    .lt("recorded_at", recorded_at)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single();

  const delta_kg = prev ? Number(prev.weight_kg) - Number(weight_kg) : 0;

  const { data: entry, error } = await supabase
    .from("weight_entries")
    .insert({ user_id: session.userId, weight_kg, recorded_at, delta_kg })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Entry already exists for this date" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (delta_kg > 0) {
    await supabase.from("burn_units").insert({
      user_id: session.userId,
      weight_entry_id: entry.id,
      kg_amount: delta_kg,
      status: "unsubmitted",
    });
  }

  return NextResponse.json({ entry });
}
