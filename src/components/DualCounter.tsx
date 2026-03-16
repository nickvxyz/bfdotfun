"use client";

import { useState, useEffect } from "react";
import { formatNumber } from "@/lib/format";

export default function DualCounter() {
  const [counterValue, setCounterValue] = useState(0);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    async function fetchCounter() {
      try {
        const res = await fetch("/api/counter");
        if (res.ok) {
          const data = await res.json();
          const totalKg = Number(data.total_kg);
          if (isFinite(totalKg)) setCounterValue(totalKg);
        }
      } catch {
        // Fall back to 0
      }
    }
    fetchCounter();
    const interval = setInterval(fetchCounter, 20_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dual-counter">
      {/* Left — static humanity counter */}
      <div className="dual-counter__block">
        <div className="dual-counter__number-row">
          <span className="dual-counter__static">~30 B</span>
          <span className="dual-counter__static-unit">KG</span>
        </div>
        <span className="dual-counter__label">
          The world&apos;s excess fat
          <button
            type="button"
            className="dual-counter__info"
            onClick={() => setTooltipOpen(!tooltipOpen)}
            aria-label="How we calculated this"
            aria-expanded={tooltipOpen}
          >
            &#9432;
          </button>
        </span>
        {tooltipOpen && (
          <div className="dual-counter__tooltip" role="tooltip">
            <p><strong>Methodology</strong></p>
            <p>Based on WHO 2022 data + Lancet 2024 projections:</p>
            <ul>
              <li>1.6B overweight adults × ~7.5 kg excess each = ~12B kg</li>
              <li>890M obese adults × ~23 kg excess each = ~20.5B kg</li>
              <li>Conservative total: ~30B kg</li>
            </ul>
            <p className="dual-counter__tooltip-note">
              Sources: WHO Global Health Observatory, Lancet 2024. Rounded conservatively. Individual variation is significant.
            </p>
          </div>
        )}
      </div>

      {/* Right — live burn counter */}
      <div className="dual-counter__block">
        <div className="counter">
          <div className="counter__row">
            <span className="counter__number counter__number--desktop">
              {formatNumber(counterValue, 9)}
            </span>
            <span className="counter__number counter__number--mobile">
              {formatNumber(counterValue, 6)}
            </span>
            <span className="counter__unit">KG</span>
          </div>
        </div>
        <span className="dual-counter__label">
          Burned by people like you
          <span className="dual-counter__live-dot" aria-hidden="true" />
        </span>
      </div>

      <p className="dual-counter__gap-text">
        The gap between these numbers is why we exist.
      </p>
    </div>
  );
}
