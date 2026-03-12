"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useBurnSubmit } from "@/hooks/useBurnSubmit";
import { calculateCostDisplay } from "@/lib/pricing";
import Header from "@/components/Header";

interface BurnUnit {
  id: string;
  kg_amount: number;
  status: string;
  weight_entry_id: string;
}

export default function SubmitPage() {
  const { user } = useAuth();
  const [burnUnits, setBurnUnits] = useState<BurnUnit[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [referrerAddress, setReferrerAddress] = useState<string | undefined>();

  const unit = user?.unit_pref === "lbs" ? "lbs" : "kg";

  useEffect(() => {
    fetch("/api/referrals/my-referrer")
      .then((r) => r.json())
      .then((d) => { if (d.referrer_wallet) setReferrerAddress(d.referrer_wallet); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function fetchBurnUnits() {
      try {
        const res = await fetch("/api/burn-units?status=unsubmitted");
        if (res.ok) {
          const data = await res.json();
          const units = data.burn_units || [];
          setBurnUnits(units);
          setSelected(new Set(units.map((u: BurnUnit) => u.id)));
        }
      } catch {
        // API not connected
      }
      setLoading(false);
    }
    fetchBurnUnits();
  }, []);

  const toggleUnit = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedKgRounded = useMemo(
    () => Math.round(
      burnUnits
        .filter((u) => selected.has(u.id))
        .reduce((sum, u) => sum + Number(u.kg_amount), 0),
    ),
    [burnUnits, selected],
  );

  const costDisplay = useMemo(
    () => calculateCostDisplay(selectedKgRounded, false),
    [selectedKgRounded],
  );

  const selectedIds = useMemo(
    () => burnUnits.filter((u) => selected.has(u.id)).map((u) => u.id),
    [burnUnits, selected],
  );

  const { submit, state, error, reset } = useBurnSubmit({
    kgAmount: selectedKgRounded,
    isRetrospective: false,
    burnUnitIds: selectedIds,
    referrerAddress,
    onSuccess: () => {
      setBurnUnits((prev) => prev.filter((u) => !selected.has(u.id)));
      setSelected(new Set());
    },
  });

  const displayWeight = (kg: number) => {
    if (unit === "lbs") return (kg * 2.20462).toFixed(1);
    return kg.toFixed(1);
  };

  const isIdle = state === "idle" || state === "error";
  const isPending = state === "pending" || state === "confirming" || state === "verifying";

  const stateLabel: Record<string, string> = {
    pending: "Preparing...",
    confirming: "Confirm in wallet...",
    verifying: "Verifying on-chain...",
    success: "Submitted!",
  };

  if (user?.group_id) {
    return (
      <>
        <Header />
        <div className="submit">
          <Link href="/profile" className="back-link" aria-label="Back to Profile">&larr; Back to Profile</Link>
          <h1 className="submit__title">Submit to Global</h1>
        <div className="submit__auto">
          <p className="submit__auto-text">
            Your burns are automatically submitted to the Global Ledger through
            your Pro group. No action needed.
          </p>
          <span className="submit__auto-badge">Auto-submitted via Pro</span>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
    <Header />
    <div className="submit">
      <Link href="/profile" className="back-link" aria-label="Back to Profile">&larr; Back to Profile</Link>
      <h1 className="submit__title">Submit to Global Ledger</h1>
      <p className="submit__desc">
        Select burn units to submit. Each kg costs $1 USDC on Base.
      </p>

      {loading ? (
        <p className="submit__loading">Loading burn units...</p>
      ) : burnUnits.length === 0 ? (
        <p className="submit__empty">
          {state === "success"
            ? "All burns submitted! Check the global ledger."
            : "No unsubmitted burns yet. Log weight entries to generate burn units."}
        </p>
      ) : (
        <>
          <div className="submit__units">
            {burnUnits.map((u) => (
              <label key={u.id} className="submit__unit">
                <input
                  type="checkbox"
                  className="submit__unit-check"
                  checked={selected.has(u.id)}
                  onChange={() => toggleUnit(u.id)}
                  disabled={!isIdle}
                />
                <span className="submit__unit-amount">
                  {displayWeight(Number(u.kg_amount))} {unit}
                </span>
              </label>
            ))}
          </div>

          <div className="submit__summary">
            <div className="submit__summary-row">
              <span>Total</span>
              <span>{displayWeight(selectedKgRounded)} {unit}</span>
            </div>
            <div className="submit__summary-row submit__summary-row--total">
              <span>Cost</span>
              <span>${costDisplay} USDC</span>
            </div>
          </div>

          {error && (
            <p className="submit__error">
              {error}
            </p>
          )}

          <button
            className="submit__cta"
            disabled={selected.size === 0 || isPending}
            onClick={submit}
            aria-label={`Submit ${selectedKgRounded} kg for ${costDisplay} USDC`}
          >
            {isPending
              ? stateLabel[state] || "Processing..."
              : `Approve & Submit $${costDisplay} USDC`}
          </button>

          {state === "error" && (
            <button
              className="submit__retry"
              onClick={reset}
              aria-label="Try again"
            >
              Try Again
            </button>
          )}

          <p className="submit__note">
            Requires USDC on Base. One wallet popup for approve + submit.
          </p>
        </>
      )}
    </div>
    </>
  );
}
