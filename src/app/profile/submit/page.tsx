"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

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

  const unit = user?.unit_pref === "lbs" ? "lbs" : "kg";

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

  const selectedKg = burnUnits
    .filter((u) => selected.has(u.id))
    .reduce((sum, u) => sum + Number(u.kg_amount), 0);

  const usdcAmount = selectedKg; // $1 per kg

  const displayWeight = (kg: number) => {
    if (unit === "lbs") return (kg * 2.20462).toFixed(1);
    return kg.toFixed(1);
  };

  if (user?.group_id) {
    return (
      <div className="submit">
        <h1 className="submit__title">Submit to Global</h1>
        <div className="submit__auto">
          <p className="submit__auto-text">
            Your burns are automatically submitted to the Global Ledger through
            your Pro group. No action needed.
          </p>
          <span className="submit__auto-badge">Auto-submitted via Pro</span>
        </div>
      </div>
    );
  }

  return (
    <div className="submit">
      <h1 className="submit__title">Submit to Global Ledger</h1>
      <p className="submit__desc">
        Select burn units to submit. Each kg costs $1 USDC on Base.
      </p>

      {loading ? (
        <p className="submit__loading">Loading burn units...</p>
      ) : burnUnits.length === 0 ? (
        <p className="submit__empty">
          No unsubmitted burns yet. Log weight entries to generate burn units.
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
              <span>{displayWeight(selectedKg)} {unit}</span>
            </div>
            <div className="submit__summary-row submit__summary-row--total">
              <span>Cost</span>
              <span>${usdcAmount.toFixed(2)} USDC</span>
            </div>
          </div>

          <button
            className="submit__cta"
            disabled={selected.size === 0}
          >
            Approve & Submit ${usdcAmount.toFixed(2)} USDC
          </button>
          <p className="submit__note">
            Requires USDC on Base. Approve spend first, then submit.
          </p>
        </>
      )}
    </div>
  );
}
