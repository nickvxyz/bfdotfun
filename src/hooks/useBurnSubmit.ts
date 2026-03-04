"use client";

import { useState, useCallback } from "react";
import { useSendCalls, useConfig } from "wagmi";
import { getCallsStatus } from "@wagmi/core";
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

  const config = useConfig();
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

      // sendCallsAsync returns { id } — a batch ID, NOT a tx hash.
      // Poll getCallsStatus to get the actual transaction hash from receipts.
      const batchId = callsId.id;
      setState("verifying");

      const MAX_POLLS = 60;
      const POLL_INTERVAL = 2000;
      let realTxHash: string | null = null;

      for (let i = 0; i < MAX_POLLS; i++) {
        const result = await getCallsStatus(config, { id: batchId });

        if (result.status === "success" && result.receipts?.length) {
          realTxHash = result.receipts[result.receipts.length - 1].transactionHash;
          break;
        }

        if (result.status === "failure") {
          throw new Error("Transaction failed on-chain");
        }

        // Still pending — wait and retry
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
      }

      if (!realTxHash) {
        throw new Error("Timed out waiting for transaction confirmation");
      }

      setTxHash(realTxHash);

      // Record submission on backend with the real tx hash
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_hash: realTxHash,
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
  }, [kgAmount, isRetrospective, burnUnitIds, onSuccess, sendCallsAsync, config]);

  return { submit, state, txHash, error, reset };
}
