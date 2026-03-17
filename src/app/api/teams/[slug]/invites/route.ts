import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { IS_DEV_MODE } from "@/lib/dev";

function generateCode(length = 6): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (IS_DEV_MODE) {
    return NextResponse.json({ codes: [] });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: team } = await supabase
    .from("pro_groups")
    .select("id, owner_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.owner_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: codes, error } = await supabase
    .from("team_invite_codes")
    .select("*")
    .eq("team_id", team.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ codes });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (IS_DEV_MODE) {
    const code = generateCode();
    return NextResponse.json({
      codes: [{ id: `tc-${Date.now()}`, code, max_uses: 50, use_count: 0, created_at: new Date().toISOString() }],
    }, { status: 201 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: team } = await supabase
    .from("pro_groups")
    .select("id, owner_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.owner_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { max_uses } = await request.json().catch(() => ({}));

  const { data: codes, error: insertError } = await supabase
    .from("team_invite_codes")
    .insert({
      team_id: team.id,
      code: generateCode(),
      max_uses: max_uses ?? 50,
      created_by: session.userId,
    })
    .select();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ codes }, { status: 201 });
}
