"use client";

import { useState, useCallback } from "react";
import { useSendCalls } from "wagmi";
import { encodeFunctionData } from "viem";
import { baseSepolia } from "viem/chains";
import { IS_DEV_MODE } from "@/lib/dev";
import { BURNFAT_TREASURY_ADDRESS, BURNFAT_TREASURY_ABI } from "@/lib/contracts/BurnFatTreasury";
import { USDC_ADDRESS, ERC20_ABI } from "@/lib/contracts/erc20";
import { calculateCostUsdc } from "@/lib/pricing";

type SubmitState = "idle" | "pending" | "confirming" | "verifying" | "success" | "error";

interface UseBurnSubmitOptions {
  kgAmount: number;
  isRetrospective: boolean;
  burnUnitIds?: string[];
  onSuccess?: () => void;
}

interface UseBurnSubmitReturn {
  submit: () => void;
  state: SubmitState;
  txHash: string | null;
  error: string | null;
  reset: () => void;
}

export function useBurnSubmit({
  kgAmount,
  isRetrospective,
  burnUnitIds,
  onSuccess,
}: UseBurnSubmitOptions): UseBurnSubmitReturn {
  const [state, setState] = useState<SubmitState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { sendCallsAsync } = useSendCalls();

  const reset = useCallback(() => {
    setState("idle");
    setTxHash(null);
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    if (kgAmount <= 0) return;

    setState("pending");
    setError(null);
    setTxHash(null);

    try {
      // Dev mode: simulate with fake tx hash
      if (IS_DEV_MODE) {
        const fakeTxHash = `0xdev${Date.now().toString(16).padStart(60, "0")}`;
        setTxHash(fakeTxHash);
        setState("verifying");

        const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tx_hash: fakeTxHash,
            kg_total: kgAmount,
            submission_type: isRetrospective ? "retrospective" : "individual",
            burn_unit_ids: burnUnitIds,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Submission failed");
        }

        setState("success");
        onSuccess?.();
        return;
      }

      // Production: batch approve + submitBurn in one wallet popup
      if (!BURNFAT_TREASURY_ADDRESS || !USDC_ADDRESS) {
        throw new Error("Contract addresses not configured");
      }

      const usdcAmount = calculateCostUsdc(kgAmount, isRetrospective);

      const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [BURNFAT_TREASURY_ADDRESS, usdcAmount],
      });

      const submitBurnData = encodeFunctionData({
        abi: BURNFAT_TREASURY_ABI,
        functionName: "submitBurn",
        args: [BigInt(kgAmount), isRetrospective],
      });

      setState("confirming");

      const callsId = await sendCallsAsync({
        calls: [
          {
            to: USDC_ADDRESS,
            data: approveData,
          },
          {
            to: BURNFAT_TREASURY_ADDRESS,
            data: submitBurnData,
          },
        ],
        chainId: baseSepolia.id,
      });

      // sendCallsAsync returns { id, capabilities? } — extract the batch ID
      const batchId = callsId.id;
      setTxHash(batchId);
      setState("verifying");

      // Record submission on backend
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_hash: batchId,
          kg_total: kgAmount,
          submission_type: isRetrospective ? "retrospective" : "individual",
          burn_unit_ids: burnUnitIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission recording failed");
      }

      setState("success");
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      // User rejected = go back to idle, not error
      if (message.includes("User rejected") || message.includes("denied")) {
        setState("idle");
        return;
      }
      setError(message);
      setState("error");
    }
  }, [kgAmount, isRetrospective, burnUnitIds, onSuccess, sendCallsAsync]);

  return { submit, state, txHash, error, reset };
}
