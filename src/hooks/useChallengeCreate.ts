"use client";

import { useState, useCallback } from "react";
import { useSendCalls } from "wagmi";
import { encodeFunctionData } from "viem";
import { baseSepolia } from "viem/chains";
import { IS_DEV_MODE } from "@/lib/dev";
import { CHALLENGE_POOL_ADDRESS, CHALLENGE_POOL_ABI } from "@/lib/contracts/ChallengePool";
import { USDC_ADDRESS, ERC20_ABI } from "@/lib/contracts/erc20";

type CreateState = "idle" | "pending" | "confirming" | "verifying" | "success" | "error";

interface UseChallengeCreateOptions {
  prizePoolUsdc: bigint;
  endsAt: number;
  claimDeadline: number;
}

interface UseChallengeCreateReturn {
  submit: () => Promise<{ txHash: string; contractChallengeId: number | null } | null>;
  state: CreateState;
  error: string | null;
  reset: () => void;
  txHash: string | null;
}

export function useChallengeCreate({
  prizePoolUsdc,
  endsAt,
  claimDeadline,
}: UseChallengeCreateOptions): UseChallengeCreateReturn {
  const [state, setState] = useState<CreateState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { sendCallsAsync } = useSendCalls();

  const reset = useCallback(() => {
    setState("idle");
    setTxHash(null);
    setError(null);
  }, []);

  const submit = useCallback(async (): Promise<{ txHash: string; contractChallengeId: number | null } | null> => {
    if (prizePoolUsdc <= BigInt(0)) return null;

    setState("pending");
    setError(null);
    setTxHash(null);

    try {
      if (IS_DEV_MODE) {
        const fakeTxHash = `0xdev-challenge-${Date.now().toString(16).padStart(54, "0")}`;
        setTxHash(fakeTxHash);
        setState("success");
        return { txHash: fakeTxHash, contractChallengeId: Math.floor(Math.random() * 1000) + 1 };
      }

      if (!CHALLENGE_POOL_ADDRESS || !USDC_ADDRESS) {
        throw new Error("Contract addresses not configured");
      }

      const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CHALLENGE_POOL_ADDRESS, prizePoolUsdc],
      });

      const createChallengeData = encodeFunctionData({
        abi: CHALLENGE_POOL_ABI,
        functionName: "createChallenge",
        args: [prizePoolUsdc, BigInt(endsAt), BigInt(claimDeadline)],
      });

      setState("confirming");

      const callsId = await sendCallsAsync({
        calls: [
          { to: USDC_ADDRESS, data: approveData },
          { to: CHALLENGE_POOL_ADDRESS, data: createChallengeData },
        ],
        chainId: baseSepolia.id,
      });

      const batchId = callsId.id;
      setTxHash(batchId);
      setState("verifying");

      // Extract contract_challenge_id from event — not available synchronously from batch
      // The backend will need to parse this from the receipt
      setState("success");
      return { txHash: batchId, contractChallengeId: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      if (message.includes("User rejected") || message.includes("denied")) {
        setState("idle");
        return null;
      }
      setError(message);
      setState("error");
      return null;
    }
  }, [prizePoolUsdc, endsAt, claimDeadline, sendCallsAsync]);

  return { submit, state, error, reset, txHash };
}
