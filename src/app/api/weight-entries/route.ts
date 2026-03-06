import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { IS_DEV_MODE } from "@/lib/dev";

// In-memory store for dev mode — starts empty, persists within server session
const devEntries: Array<{
  id: string;
  user_id: string;
  weight_kg: number;
  recorded_at: string;
  delta_kg: number;
  fat_mass_kg: number | null;
}> = [];

// Shared with burn-units and submissions routes via module import
export const devBurnUnits: Array<{
  id: string;
  user_id: string;
  weight_entry_id: string;
  kg_amount: number;
  status: string;
  created_at: string;
}> = [];

function recalculateDeltas() {
  const sorted = [...devEntries].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));

  // Build a set of entry IDs that already have submitted burn units
  const submittedEntryIds = new Set(
    devBurnUnits.filter((u) => u.status !== "unsubmitted").map((u) => u.weight_entry_id),
  );

  // Remove only unsubmitted burn units — preserve submitted ones
  for (let i = devBurnUnits.length - 1; i >= 0; i--) {
    if (devBurnUnits[i].status === "unsubmitted") {
      devBurnUnits.splice(i, 1);
    }
  }

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (i === 0) {
      entry.delta_kg = 0;
    } else {
      entry.delta_kg = sorted[i - 1].weight_kg - entry.weight_kg;
    }
    // Only create a new burn unit if delta > 0 and no submitted unit already exists for this entry
    if (entry.delta_kg > 0 && !submittedEntryIds.has(entry.id)) {
      devBurnUnits.push({
        id: `b-${entry.id}`,
        user_id: "dev-user-001",
        weight_entry_id: entry.id,
        kg_amount: entry.delta_kg,
        status: "unsubmitted",
        created_at: entry.recorded_at,
      });
    }
  }
}

async function getSession(): Promise<{ userId: string } | null> {
  const c = await cookies();
  const raw = c.get("bf_session")?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.userId || typeof parsed.userId !== "string") return null;
    return parsed;
  } catch { return null; }
}

export async function GET() {
  if (IS_DEV_MODE) {
    return NextResponse.json({ entries: [...devEntries].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)) });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("weight_entries")
    .select("*")
    .eq("user_id", session.userId)
    .order("recorded_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data });
}

export async function POST(request: NextRequest) {
  if (IS_DEV_MODE) {
    const body = await request.json();
    const weightKg = Number(body.weight_kg);
    const recordedAt = body.recorded_at;
    const fatMassKg = body.fat_mass_kg != null ? Number(body.fat_mass_kg) : null;

    // Check for duplicate date
    if (devEntries.some((e) => e.recorded_at === recordedAt)) {
      return NextResponse.json({ error: "Entry already exists for this date" }, { status: 409 });
    }

    const entry = {
      id: `e-${Date.now()}`,
      user_id: "dev-user-001",
      weight_kg: weightKg,
      recorded_at: recordedAt,
      delta_kg: 0,
      fat_mass_kg: fatMassKg,
    };
    devEntries.push(entry);

    // Recalculate all deltas and rebuild unsubmitted burn units
    recalculateDeltas();
    // Challenge attribution handled via API in production

    return NextResponse.json({ entry });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { weight_kg, recorded_at, fat_mass_kg } = await request.json();
  if (!weight_kg || !recorded_at) {
    return NextResponse.json({ error: "Missing weight_kg or recorded_at" }, { status: 400 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: prev } = await supabase
    .from("weight_entries")
    .select("weight_kg")
    .eq("user_id", session.userId)
    .lt("recorded_at", recorded_at)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let delta_kg = 0;
  if (prev) {
    delta_kg = Number(prev.weight_kg) - Number(weight_kg);
  } else {
    const { data: userRow } = await supabase
      .from("users")
      .select("starting_weight")
      .eq("id", session.userId)
      .maybeSingle();
    if (userRow?.starting_weight) {
      delta_kg = Number(userRow.starting_weight) - Number(weight_kg);
    }
  }

  const insertData: Record<string, unknown> = {
    user_id: session.userId,
    weight_kg,
    recorded_at,
    delta_kg,
  };
  if (fat_mass_kg != null) {
    if (Number(fat_mass_kg) > Number(weight_kg)) {
      return NextResponse.json({ error: "Fat mass cannot exceed total weight" }, { status: 400 });
    }
    insertData.fat_mass_kg = fat_mass_kg;
  }

  const { data: entry, error } = await supabase
    .from("weight_entries")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Entry already exists for this date" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let burnUnitId: string | null = null;

  if (delta_kg > 0) {
    const { data: burnUnit, error: burnError } = await supabase
      .from("burn_units")
      .insert({
        user_id: session.userId,
        weight_entry_id: entry.id,
        kg_amount: delta_kg,
        status: "unsubmitted",
      })
      .select("id")
      .single();
    if (burnError) console.error("Failed to create burn unit:", burnError);
    else burnUnitId = burnUnit?.id ?? null;
  }

  // Challenge attribution — best-effort, wrapped in try/catch
  try {
    const { data: participations } = await supabase
      .from("challenge_participants")
      .select("id, challenge_id, challenges!inner(status)")
      .eq("user_id", session.userId)
      .eq("challenges.status", "active");

    if (participations && participations.length > 0) {
      // Attribute to ALL active challenges the user participates in
      for (const rawParticipation of participations) {
        const participation = rawParticipation as unknown as {
          id: string;
          challenge_id: string;
          challenges: { status: string };
        };

        // Insert challenge_weight_entries junction record
        const { error: cweError } = await supabase
          .from("challenge_weight_entries")
          .insert({
            challenge_id: participation.challenge_id,
            weight_entry_id: entry.id,
            participant_id: participation.id,
            delta_kg,
          });
        if (cweError) console.error("Failed to insert challenge_weight_entry:", cweError);
      }

      // If positive delta, update burn unit and create auto-submission (once, for the first challenge)
      if (delta_kg > 0 && burnUnitId) {
        const firstParticipation = participations[0] as unknown as { challenge_id: string };
        const { error: burnUpdateError } = await supabase
          .from("burn_units")
          .update({
            status: "attributed_to_challenge",
            challenge_id: firstParticipation.challenge_id,
          })
          .eq("id", burnUnitId);
        if (burnUpdateError) console.error("Failed to update burn unit for challenge:", burnUpdateError);

        const { error: subError } = await supabase.from("submissions").insert({
          submitter_id: session.userId,
          kg_total: delta_kg,
          usdc_amount: 0,
          tx_hash: `challenge-auto-${entry.id}`,
          submission_type: "challenge_auto",
        });
        if (subError) console.error("Failed to create challenge auto-submission:", subError);
      }
    }
  } catch (err) {
    console.error("Challenge attribution failed (non-fatal):", err);
  }

  return NextResponse.json({ entry });
}
