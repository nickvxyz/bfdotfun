import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { IS_DEV_MODE, DEV_CHALLENGES, DEV_PARTICIPATION } from "@/lib/dev";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (IS_DEV_MODE) {
    const challenge = DEV_CHALLENGES.find((ch) => ch.slug === slug);
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

    const participation = DEV_PARTICIPATION.find(
      (p) => p.challenge_id === challenge.id && p.user_id === "dev-user-001",
    );
    if (!participation) return NextResponse.json({ error: "Not a participant" }, { status: 404 });

    return NextResponse.json({
      contract_challenge_id: null,
      reward_usdc: participation.reward_usdc,
      proof: null,
      claimed: participation.reward_claimed,
    });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id, merkle_root, status, contract_challenge_id")
    .eq("slug", slug)
    .maybeSingle();

  if (challengeError) return NextResponse.json({ error: challengeError.message }, { status: 500 });
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  const { data: participation, error: participationError } = await supabase
    .from("challenge_participants")
    .select("reward_usdc, reward_claimed, claim_tx_hash")
    .eq("challenge_id", challenge.id)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (participationError) return NextResponse.json({ error: participationError.message }, { status: 500 });
  if (!participation) return NextResponse.json({ error: "Not a participant" }, { status: 404 });

  let proof: string[] | null = null;

  if (challenge.merkle_root && participation.reward_usdc) {
    // Fetch user wallet address for proof lookup
    const { data: user } = await supabase
      .from("users")
      .select("wallet_address")
      .eq("id", session.userId)
      .maybeSingle();

    if (user?.wallet_address) {
      // Load tree from challenge metadata — tree is stored externally, reconstruct from participants
      const { data: allParticipants } = await supabase
        .from("challenge_participants")
        .select("reward_usdc, user_id")
        .eq("challenge_id", challenge.id)
        .gt("reward_usdc", 0);

      if (allParticipants && allParticipants.length > 0) {
        const userIds = allParticipants.map((p) => p.user_id);
        const { data: allUsers } = await supabase
          .from("users")
          .select("id, wallet_address")
          .in("id", userIds);

        const addressMap = new Map((allUsers ?? []).map((u) => [u.id, u.wallet_address as string]));

        const { buildMerkleTree, getProof } = await import("@/lib/merkle");
        const rewardEntries = allParticipants
          .filter((p) => addressMap.get(p.user_id))
          .map((p) => ({
            address: addressMap.get(p.user_id)!,
            amount: String(Math.floor(Number(p.reward_usdc) * 1_000_000)),
          }));

        if (rewardEntries.length > 0) {
          const tree = buildMerkleTree(rewardEntries);
          const result = getProof(tree.dump(), user.wallet_address);
          if (result) proof = result.proof;
        }
      }
    }
  }

  return NextResponse.json({
    contract_challenge_id: challenge.contract_challenge_id,
    reward_usdc: participation.reward_usdc,
    proof,
    claimed: participation.reward_claimed,
    claim_tx_hash: participation.claim_tx_hash ?? null,
  });
}
