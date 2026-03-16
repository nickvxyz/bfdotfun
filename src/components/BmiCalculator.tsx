"use client";

import { useState } from "react";
import BmiGauge from "@/components/BmiGauge";

type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

function getBmiCategory(bmi: number): { key: BmiCategory; label: string } {
  if (bmi < 18.5) return { key: "underweight", label: "Underweight" };
  if (bmi < 25) return { key: "normal", label: "Normal" };
  if (bmi < 30) return { key: "overweight", label: "Overweight" };
  return { key: "obese", label: "Obese" };
}

export default function BmiCalculator({ onComplete }: { onComplete?: () => void } = {}) {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<{
    bmi: number;
    category: { key: BmiCategory; label: string };
    kgToBurn: number;
  } | null>(null);
  const [missionVisible, setMissionVisible] = useState(false);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return;

    const heightM = h / 100;
    const bmi = w / (heightM * heightM);
    const category = getBmiCategory(bmi);
    const healthyWeight = 24.9 * heightM * heightM;
    const kgToBurn = bmi > 25 ? Math.round((w - healthyWeight) * 10) / 10 : 0;

    setMissionVisible(false);
    setResult({ bmi, category, kgToBurn });
  };

  const handleVerdictReady = () => {
    // Delay mission block appearance after verdict slams in
    setTimeout(() => {
      setMissionVisible(true);
      onComplete?.();
    }, 600);
  };

  const handleReset = () => {
    setResult(null);
    setMissionVisible(false);
  };

  return (
    <div className="bmi-calc">
      <form
        className={`bmi-calc__form${result ? " bmi-calc__form--hidden" : ""}`}
        onSubmit={handleCheck}
      >
        <div className="bmi-calc__fields">
          <div className="bmi-calc__row">
            <div className="bmi-calc__field">
              <label className="bmi-calc__label" htmlFor="bmi-height">Height (cm)</label>
              <input
                id="bmi-height"
                type="number"
                step="1"
                min="100"
                max="250"
                className="bmi-calc__input"
                placeholder="178"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
              />
            </div>
            <div className="bmi-calc__field">
              <label className="bmi-calc__label" htmlFor="bmi-weight">Weight (kg)</label>
              <input
                id="bmi-weight"
                type="number"
                step="0.1"
                min="30"
                max="300"
                className="bmi-calc__input"
                placeholder="82.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="bmi-calc__submit">Calculate My BMI</button>
        </div>
      </form>

      {result && (
        <div className="bmi-calc__result">
          <div className="bmi-calc__gauge-wrap">
            <BmiGauge bmi={result.bmi} onVerdictReady={handleVerdictReady} />
          </div>

          {missionVisible && (
            <div className="bmi-calc__mission bmi-calc__mission--enter">
              {result.kgToBurn > 0 ? (
                <>
                  <p className="bmi-calc__mission-label">YOUR MISSION</p>
                  <p className="bmi-calc__mission-number">
                    BURN {result.kgToBurn} <span className="bmi-calc__mission-unit">KG</span>
                  </p>
                  <p className="bmi-calc__mission-text">
                    That&apos;s what stands between you and a healthy BMI. When you burn it, it goes on the global ledger — permanently.
                  </p>
                </>
              ) : result.category.key === "normal" ? (
                <>
                  <p className="bmi-calc__mission-label">YOUR MISSION</p>
                  <p className="bmi-calc__mission-status">STAY THE COURSE</p>
                  <p className="bmi-calc__mission-text">
                    You&apos;re in the healthy range. Track your progress, join a team, and help close the gap. Every kilogram counts.
                  </p>
                </>
              ) : (
                <>
                  <p className="bmi-calc__mission-label">YOUR STATUS</p>
                  <p className="bmi-calc__mission-status bmi-calc__mission-status--muted">UNDERWEIGHT</p>
                  <p className="bmi-calc__mission-text">
                    Focus on building strength and healthy habits.
                    When you&apos;re ready, your journey goes on the record.
                  </p>
                </>
              )}

              <div className="bmi-calc__bottom">
                <p className="bmi-calc__disclaimer">
                  *BMI is a rough indicator and doesn&apos;t account for muscle mass, bone density, or body composition.
                </p>
                <button type="button" className="bmi-calc__reset" onClick={handleReset}>
                  Check again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
