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
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { tx_hash } = body as { tx_hash?: string };

  if (!tx_hash) return NextResponse.json({ error: "tx_hash is required" }, { status: 400 });

  if (IS_DEV_MODE) {
    const challenge = DEV_CHALLENGES.find((ch) => ch.slug === slug);
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

    const participation = DEV_PARTICIPATION.find(
      (p) => p.challenge_id === challenge.id && p.user_id === "dev-user-001",
    );
    if (!participation) return NextResponse.json({ error: "Not a participant" }, { status: 404 });

    participation.reward_claimed = true;
    return NextResponse.json({ claimed: true });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id, status, contract_challenge_id")
    .eq("slug", slug)
    .maybeSingle();

  if (challengeError) return NextResponse.json({ error: challengeError.message }, { status: 500 });
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  if (challenge.status !== "finalized") {
    return NextResponse.json({ error: "Challenge is not finalized" }, { status: 400 });
  }

  const { data: participation, error: participationError } = await supabase
    .from("challenge_participants")
    .select("id, reward_claimed, user_id")
    .eq("challenge_id", challenge.id)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (participationError) return NextResponse.json({ error: participationError.message }, { status: 500 });
  if (!participation) return NextResponse.json({ error: "Not a participant" }, { status: 404 });
  if (participation.reward_claimed) {
    return NextResponse.json({ error: "Reward already claimed" }, { status: 409 });
  }

  // Verify transaction on-chain if it looks like a real tx hash (0x + 64 hex chars)
  // Batch IDs from useSendCalls are NOT tx hashes — skip verification for those
  const isTxHash = /^0x[0-9a-fA-F]{64}$/.test(tx_hash);

  if (isTxHash) {
    try {
      const { baseSepoliaClient } = await import("@/lib/viem");
      const { CHALLENGE_POOL_ABI } = await import("@/lib/contracts/ChallengePool");
      const { parseEventLogs } = await import("viem");

      const receipt = await baseSepoliaClient.getTransactionReceipt({
        hash: tx_hash as `0x${string}`,
      });

      if (receipt.status !== "success") {
        return NextResponse.json({ error: "Transaction failed on-chain" }, { status: 400 });
      }

      const claimEvents = parseEventLogs({
        abi: CHALLENGE_POOL_ABI,
        eventName: "RewardClaimed",
        logs: receipt.logs,
      });

      if (claimEvents.length === 0) {
        return NextResponse.json({ error: "No RewardClaimed event found in transaction" }, { status: 400 });
      }

      const event = claimEvents[0];
      if (
        challenge.contract_challenge_id !== null &&
        Number(event.args.challengeId) !== challenge.contract_challenge_id
      ) {
        return NextResponse.json({ error: "Transaction is for a different challenge" }, { status: 400 });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed";
      return NextResponse.json({ error: `TX verification failed: ${message}` }, { status: 400 });
    }
  }

  const { error: updateError } = await supabase
    .from("challenge_participants")
    .update({ reward_claimed: true, claim_tx_hash: tx_hash })
    .eq("id", participation.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ claimed: true });
}
