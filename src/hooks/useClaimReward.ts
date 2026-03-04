"use client";

import { useState, useCallback } from "react";
import { useSendCalls } from "wagmi";
import { encodeFunctionData } from "viem";
import { baseSepolia } from "viem/chains";
import { IS_DEV_MODE } from "@/lib/dev";
import { CHALLENGE_POOL_ADDRESS, CHALLENGE_POOL_ABI } from "@/lib/contracts/ChallengePool";

type ClaimState = "idle" | "fetching" | "confirming" | "verifying" | "success" | "error";

interface UseClaimRewardOptions {
  slug: string;
  onSuccess?: () => void;
}

interface UseClaimRewardReturn {
  claim: () => void;
  state: ClaimState;
  error: string | null;
  reset: () => void;
}

export function useClaimReward({ slug, onSuccess }: UseClaimRewardOptions): UseClaimRewardReturn {
  const [state, setState] = useState<ClaimState>("idle");
  const [error, setError] = useState<string | null>(null);

  const { sendCallsAsync } = useSendCalls();

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
  }, []);

  const claim = useCallback(async () => {
    setState("fetching");
    setError(null);

    try {
      if (IS_DEV_MODE) {
        setState("success");
        onSuccess?.();
        return;
      }

      // Fetch Merkle proof from backend
      const proofRes = await fetch(`/api/challenges/${slug}/rewards`);
      if (!proofRes.ok) {
        const data = await proofRes.json();
        throw new Error(data.error || "Failed to fetch reward proof");
      }

      const rewardData = await proofRes.json() as {
        contract_challenge_id: number | null;
        reward_usdc: number;
        proof: string[] | null;
        claimed: boolean;
      };

      if (rewardData.claimed) {
        throw new Error("Reward already claimed");
      }

      if (!rewardData.proof || !rewardData.contract_challenge_id) {
        throw new Error("Reward proof not available yet");
      }

      if (!CHALLENGE_POOL_ADDRESS) {
        throw new Error("Contract address not configured");
      }

      const amountUnits = BigInt(Math.floor(rewardData.reward_usdc * 1_000_000));

      const claimData = encodeFunctionData({
        abi: CHALLENGE_POOL_ABI,
        functionName: "claimReward",
        args: [
          BigInt(rewardData.contract_challenge_id),
          amountUnits,
          rewardData.proof as `0x${string}`[],
        ],
      });

      setState("confirming");

      const callsId = await sendCallsAsync({
        calls: [{ to: CHALLENGE_POOL_ADDRESS, data: claimData }],
        chainId: baseSepolia.id,
      });

      const batchId = callsId.id;
      setState("verifying");

      // Record claim on backend (batch ID, not a tx hash)
      const claimRes = await fetch(`/api/challenges/${slug}/rewards/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_hash: batchId }),
      });

      if (!claimRes.ok) {
        const data = await claimRes.json();
        throw new Error(data.error || "Failed to record claim");
      }

      setState("success");
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Claim failed";
      if (message.includes("User rejected") || message.includes("denied")) {
        setState("idle");
        return;
      }
      setError(message);
      setState("error");
    }
  }, [slug, onSuccess, sendCallsAsync]);

  return { claim, state, error, reset };
}
