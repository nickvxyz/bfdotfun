"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useBurnSubmit } from "@/hooks/useBurnSubmit";
import { calculateCostDisplay, RETROSPECTIVE_PRICE_PER_KG } from "@/lib/pricing";

export default function RetrospectivePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [kgInput, setKgInput] = useState("");

  const unit = user?.unit_pref === "lbs" ? "lbs" : "kg";

  // Convert input to kg for calculations
  const kgAmount = useMemo(() => {
    const val = parseFloat(kgInput);
    if (!val || val <= 0) return 0;
    if (unit === "lbs") return Math.round(val / 2.20462);
    return Math.round(val);
  }, [kgInput, unit]);

  const costDisplay = useMemo(
    () => (kgAmount > 0 ? calculateCostDisplay(kgAmount, true) : "0.00"),
    [kgAmount],
  );

  const { submit, state, error, reset } = useBurnSubmit({
    kgAmount,
    isRetrospective: true,
    onSuccess: () => {
      updateUser({ has_used_retrospective: true });
      setTimeout(() => router.push("/profile"), 2000);
    },
  });

  // Already used retrospective — redirect (must be in effect, not render)
  useEffect(() => {
    if (user?.has_used_retrospective) {
      router.push("/profile");
    }
  }, [user?.has_used_retrospective, router]);

  if (user?.has_used_retrospective) {
    return null;
  }

  const isIdle = state === "idle" || state === "error";
  const isPending = state === "pending" || state === "confirming" || state === "verifying";

  const stateLabel: Record<string, string> = {
    pending: "Preparing transaction...",
    confirming: "Confirm in wallet...",
    verifying: "Verifying on-chain...",
    success: "Claimed! Redirecting...",
  };

  return (
    <div className="retro">
      <h1 className="retro__title">Claim Past Fat Loss</h1>
      <p className="retro__subtitle">
        One-time offer: submit historical fat loss at 50% off.
        ${RETROSPECTIVE_PRICE_PER_KG.toFixed(2)}/kg instead of $1.00/kg.
      </p>

      <div className="retro__card">
        <label className="retro__label" htmlFor="retro-amount">
          How much fat have you burned before joining? ({unit})
        </label>
        <input
          id="retro-amount"
          type="number"
          step="1"
          min="1"
          className="retro__input"
          placeholder={unit === "lbs" ? "e.g. 20" : "e.g. 10"}
          value={kgInput}
          onChange={(e) => setKgInput(e.target.value)}
          disabled={!isIdle}
        />
        {unit === "lbs" && kgAmount > 0 && (
          <p className="retro__conversion">{kgAmount} kg on the global ledger</p>
        )}

        <div className="retro__summary">
          <div className="retro__summary-row">
            <span>Amount</span>
            <span>{kgAmount} kg</span>
          </div>
          <div className="retro__summary-row">
            <span>Price</span>
            <span>${RETROSPECTIVE_PRICE_PER_KG.toFixed(2)} / kg</span>
          </div>
          <div className="retro__summary-row retro__summary-row--total">
            <span>Total</span>
            <span>${costDisplay} USDC</span>
          </div>
        </div>

        {error && (
          <p className="retro__error">{error}</p>
        )}

        {state === "success" ? (
          <div className="retro__success">
            <p className="retro__success-text">
              {kgAmount} kg claimed and added to the global ledger!
            </p>
          </div>
        ) : (
          <button
            className="retro__cta"
            disabled={kgAmount <= 0 || isPending}
            onClick={submit}
            aria-label={`Pay ${costDisplay} USDC to claim ${kgAmount} kg`}
          >
            {isPending
              ? stateLabel[state] || "Processing..."
              : `Pay $${costDisplay} USDC`}
          </button>
        )}

        {state === "error" && (
          <button
            className="retro__retry"
            onClick={reset}
            aria-label="Try again"
          >
            Try Again
          </button>
        )}

        <p className="retro__note">
          Requires USDC on Base Sepolia. One wallet popup for approve + submit.
        </p>
      </div>
    </div>
  );
}
