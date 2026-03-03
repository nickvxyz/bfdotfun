"use client";

interface BodyFatMeterProps {
  bodyFatPercent: number;
}

const ZONES = [
  { label: "Lean", max: 14, color: "var(--c-yellow)" },
  { label: "Healthy", max: 24, color: "var(--c-green)" },
  { label: "Elevated", max: 32, color: "var(--c-orange)" },
  { label: "High", max: 50, color: "var(--c-orange)" },
];

const RANGE_MIN = 5;
const RANGE_MAX = 50;

export default function BodyFatMeter({ bodyFatPercent }: BodyFatMeterProps) {
  const clamped = Math.min(Math.max(bodyFatPercent, RANGE_MIN), RANGE_MAX);
  const percent = ((clamped - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;

  // Which zone is the user in?
  const currentZone = ZONES.find((z) => bodyFatPercent <= z.max) ?? ZONES[ZONES.length - 1];

  return (
    <div className="bf-meter">
      <div className="bf-meter__header">
        <span className="bf-meter__label">body fat</span>
        <span className="bf-meter__value">
          {bodyFatPercent.toFixed(1)}%
          <span className="bf-meter__zone" style={{ color: currentZone.color }}>
            {" "}{currentZone.label}
          </span>
        </span>
      </div>

      <div className="bf-meter__bar">
        {ZONES.map((zone, i) => {
          const prevMax = i === 0 ? RANGE_MIN : ZONES[i - 1].max;
          const width = ((zone.max - prevMax) / (RANGE_MAX - RANGE_MIN)) * 100;
          return (
            <div
              key={zone.label}
              className="bf-meter__zone-block"
              style={{ width: `${width}%`, backgroundColor: zone.color }}
              title={`${zone.label}: ${prevMax}–${zone.max}%`}
            />
          );
        })}
        <div
          className="bf-meter__marker"
          style={{ left: `${percent}%` }}
          aria-label={`Current body fat: ${bodyFatPercent.toFixed(1)}%`}
        />
      </div>

      <div className="bf-meter__legend">
        {ZONES.map((zone, i) => {
          const prevMax = i === 0 ? RANGE_MIN : ZONES[i - 1].max;
          return (
            <span key={zone.label} className="bf-meter__legend-item" style={{ color: zone.color }}>
              {prevMax}–{zone.max}%
            </span>
          );
        })}
      </div>

      <p className="bf-meter__note">
        General range — healthy varies by sex (~14–24% general guideline)
      </p>
    </div>
  );
}
