import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { IS_DEV_MODE, DEV_CHALLENGES, DEV_PARTICIPATION } from "@/lib/dev";

async function getSession() {
  const c = await cookies();
  const raw = c.get("bf_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (IS_DEV_MODE) {
    const challenge = DEV_CHALLENGES.find((ch) => ch.slug === slug);
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    if (challenge.creator_id !== "dev-user-001") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const participants = DEV_PARTICIPATION.filter(
      (p) => p.challenge_id === challenge.id && p.kg_burned > 0,
    );
    const totalKg = participants.reduce((sum, p) => sum + p.kg_burned, 0);

    const { buildMerkleTree } = await import("@/lib/merkle");
    const rewardEntries = participants.map((p) => ({
      address: "0x0000000000000000000000000000000000000001",
      amount: String(Math.floor((p.kg_burned / totalKg) * challenge.prize_pool_usdc * 1_000_000)),
    }));

    if (rewardEntries.length === 0) {
      return NextResponse.json({ error: "No eligible participants" }, { status: 400 });
    }

    const tree = buildMerkleTree(rewardEntries);
    challenge.merkle_root = tree.root;
    challenge.status = "finalized";

    return NextResponse.json({ challenge, tree: tree.dump() });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (challengeError) return NextResponse.json({ error: challengeError.message }, { status: 500 });
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  if (challenge.creator_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isPastEnd = new Date(challenge.ends_at) < new Date();
  const isEnded = challenge.status === "ended" || (challenge.status === "active" && isPastEnd);

  if (!isEnded) {
    return NextResponse.json({ error: "Challenge has not ended yet" }, { status: 400 });
  }

  // Auto-transition active → ended
  if (challenge.status === "active" && isPastEnd) {
    await supabase.from("challenges").update({ status: "ended" }).eq("id", challenge.id);
  }

  // Fetch all participants with kg_burned > 0
  const { data: participants, error: participantsError } = await supabase
    .from("challenge_participants")
    .select("id, user_id, kg_burned")
    .eq("challenge_id", challenge.id)
    .gt("kg_burned", 0);

  if (participantsError) return NextResponse.json({ error: participantsError.message }, { status: 500 });

  if (!participants || participants.length === 0) {
    return NextResponse.json({ error: "No eligible participants with kg burned" }, { status: 400 });
  }

  // Fetch wallet addresses for participants
  const userIds = participants.map((p) => p.user_id);
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, wallet_address")
    .in("id", userIds);

  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  const addressMap = new Map((users ?? []).map((u) => [u.id, u.wallet_address as string]));

  const totalKg = participants.reduce((sum, p) => sum + Number(p.kg_burned), 0);

  // Calculate pro-rata rewards (prize_pool_usdc is in dollars, convert to 6-decimal USDC units)
  const prizePoolUnits = Math.floor(Number(challenge.prize_pool_usdc) * 1_000_000);

  const { buildMerkleTree } = await import("@/lib/merkle");
  const eligible = participants.filter((p) => addressMap.get(p.user_id));

  // Distribute with remainder to avoid rounding loss
  let distributed = 0;
  const rewardEntries = eligible.map((p, i) => {
    let amount: number;
    if (i === eligible.length - 1) {
      // Last participant gets remainder to ensure sum == prizePoolUnits
      amount = prizePoolUnits - distributed;
    } else {
      amount = Math.floor((Number(p.kg_burned) / totalKg) * prizePoolUnits);
      distributed += amount;
    }
    return {
      address: addressMap.get(p.user_id)!,
      amount: String(amount),
    };
  });

  if (rewardEntries.length === 0) {
    return NextResponse.json({ error: "No participants with valid wallet addresses" }, { status: 400 });
  }

  const tree = buildMerkleTree(rewardEntries);
  const merkleRoot = tree.root;

  // Update each participant's reward_usdc
  for (const entry of rewardEntries) {
    const participant = participants.find((p) => addressMap.get(p.user_id) === entry.address);
    if (!participant) continue;

    const rewardUsdc = Number(entry.amount) / 1_000_000;
    await supabase
      .from("challenge_participants")
      .update({ reward_usdc: rewardUsdc })
      .eq("id", participant.id);
  }

  // Update challenge with merkle root and finalized status
  const { data: finalizedChallenge, error: updateError } = await supabase
    .from("challenges")
    .update({ merkle_root: merkleRoot, status: "finalized" })
    .eq("id", challenge.id)
    .select()
    .maybeSingle();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ challenge: finalizedChallenge, merkle_root: merkleRoot, tree: tree.dump() });
}
