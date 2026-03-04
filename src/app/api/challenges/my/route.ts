import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { IS_DEV_MODE, DEV_CHALLENGES, DEV_PARTICIPATION } from "@/lib/dev";

async function getSession() {
  const c = await cookies();
  const raw = c.get("bf_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (IS_DEV_MODE) {
    const participations = DEV_PARTICIPATION
      .filter((p) => p.user_id === "dev-user-001")
      .map((p) => ({
        ...p,
        challenge: DEV_CHALLENGES.find((ch) => ch.id === p.challenge_id) ?? null,
      }));

    return NextResponse.json({ participations });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("challenge_participants")
    .select(`
      *,
      challenge:challenges (*)
    `)
    .eq("user_id", session.userId)
    .order("joined_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ participations: data });
}
