"use client";

import { useState, useMemo } from "react";

interface WeightEntry {
  id: string;
  weight_kg: number;
  recorded_at: string;
  delta_kg: number;
  fat_mass_kg: number | null;
}

interface WeightChartProps {
  entries: WeightEntry[];
  goalWeight: number | null;
  heightCm: number | null;
  unitPref: "kg" | "lbs";
}

type TimeRange = "W" | "M" | "3M" | "Y";

const RANGES: { key: TimeRange; label: string; days: number }[] = [
  { key: "W", label: "W", days: 7 },
  { key: "M", label: "M", days: 30 },
  { key: "3M", label: "3M", days: 90 },
  { key: "Y", label: "Y", days: 365 },
];

const CHART_W = 600;
const CHART_H = 200;
const PAD_TOP = 24;
const PAD_BOTTOM = 32;
const PAD_LEFT = 52;
const PAD_RIGHT = 16;
const BMI_SECTION_H = 40;

function convertWeight(kg: number, unit: "kg" | "lbs"): number {
  return unit === "lbs" ? kg * 2.20462 : kg;
}

function formatWeight(kg: number, unit: "kg" | "lbs"): string {
  return convertWeight(kg, unit).toFixed(1);
}

function bmiFromKg(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function bmiColor(bmi: number): string {
  if (bmi < 18.5) return "var(--c-yellow)";
  if (bmi < 25) return "var(--c-green)";
  return "var(--c-orange)";
}

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function WeightChart({ entries, goalWeight, heightCm, unitPref }: WeightChartProps) {
  const [range, setRange] = useState<TimeRange>("M");

  const filteredEntries = useMemo(() => {
    const rangeDef = RANGES.find((r) => r.key === range)!;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDef.days);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    return [...entries]
      .filter((e) => e.recorded_at >= cutoffStr)
      .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  }, [entries, range]);

  const showBmi = heightCm != null && heightCm > 0;
  const totalH = showBmi ? CHART_H + BMI_SECTION_H : CHART_H;

  const { points, yMin, yMax, xLabels, goalY } = useMemo(() => {
    if (filteredEntries.length === 0) {
      return { points: "", yMin: 0, yMax: 100, xLabels: [] as { x: number; label: string }[], goalY: null };
    }

    const weights = filteredEntries.map((e) => convertWeight(e.weight_kg, unitPref));
    let wMin = Math.min(...weights);
    let wMax = Math.max(...weights);

    const goalConverted = goalWeight ? convertWeight(goalWeight, unitPref) : null;
    if (goalConverted !== null) {
      wMin = Math.min(wMin, goalConverted);
      wMax = Math.max(wMax, goalConverted);
    }

    // Add 5% padding to y range
    const yPad = Math.max((wMax - wMin) * 0.1, 1);
    const yMinVal = wMin - yPad;
    const yMaxVal = wMax + yPad;

    const plotW = CHART_W - PAD_LEFT - PAD_RIGHT;
    const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;

    const pts = filteredEntries.map((e, i) => {
      const x = filteredEntries.length === 1
        ? PAD_LEFT + plotW / 2
        : PAD_LEFT + (i / (filteredEntries.length - 1)) * plotW;
      const w = convertWeight(e.weight_kg, unitPref);
      const y = PAD_TOP + plotH - ((w - yMinVal) / (yMaxVal - yMinVal)) * plotH;
      return `${x},${y}`;
    });

    // X-axis labels — show up to 6 evenly spaced
    const labelCount = Math.min(filteredEntries.length, 6);
    const labels: { x: number; label: string }[] = [];
    for (let i = 0; i < labelCount; i++) {
      const idx = labelCount === 1
        ? 0
        : Math.round((i / (labelCount - 1)) * (filteredEntries.length - 1));
      const entry = filteredEntries[idx];
      const x = filteredEntries.length === 1
        ? PAD_LEFT + plotW / 2
        : PAD_LEFT + (idx / (filteredEntries.length - 1)) * plotW;
      labels.push({ x, label: dateLabel(entry.recorded_at) });
    }

    // Goal line y position
    let gY: number | null = null;
    if (goalConverted !== null) {
      gY = PAD_TOP + plotH - ((goalConverted - yMinVal) / (yMaxVal - yMinVal)) * plotH;
    }

    return { points: pts.join(" "), yMin: yMinVal, yMax: yMaxVal, xLabels: labels, goalY: gY };
  }, [filteredEntries, goalWeight, unitPref]);

  // Y-axis labels — 4 ticks
  const yLabels = useMemo(() => {
    if (filteredEntries.length === 0) return [];
    const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;
    const ticks: { y: number; label: string }[] = [];
    for (let i = 0; i < 4; i++) {
      const frac = i / 3;
      const val = yMin + (yMax - yMin) * (1 - frac);
      const y = PAD_TOP + frac * plotH;
      ticks.push({ y, label: val.toFixed(0) });
    }
    return ticks;
  }, [filteredEntries.length, yMin, yMax]);

  // BMI trend line segments
  const bmiSegments = useMemo(() => {
    if (!showBmi || filteredEntries.length < 2) return [];

    const plotW = CHART_W - PAD_LEFT - PAD_RIGHT;

    // BMI range for y-axis: 15 to 40
    const bmiMin = 15;
    const bmiMax = 40;
    const bmiPlotTop = CHART_H + 4;

    const segments: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];

    for (let i = 0; i < filteredEntries.length - 1; i++) {
      const e1 = filteredEntries[i];
      const e2 = filteredEntries[i + 1];
      const bmi1 = bmiFromKg(e1.weight_kg, heightCm!);
      const bmi2 = bmiFromKg(e2.weight_kg, heightCm!);

      const x1 = PAD_LEFT + (i / (filteredEntries.length - 1)) * plotW;
      const x2 = PAD_LEFT + ((i + 1) / (filteredEntries.length - 1)) * plotW;

      const y1 = bmiPlotTop + BMI_SECTION_H - ((Math.min(Math.max(bmi1, bmiMin), bmiMax) - bmiMin) / (bmiMax - bmiMin)) * (BMI_SECTION_H - 8);
      const y2 = bmiPlotTop + BMI_SECTION_H - ((Math.min(Math.max(bmi2, bmiMin), bmiMax) - bmiMin) / (bmiMax - bmiMin)) * (BMI_SECTION_H - 8);

      const avgBmi = (bmi1 + bmi2) / 2;
      segments.push({ x1, y1, x2, y2, color: bmiColor(avgBmi) });
    }

    return segments;
  }, [showBmi, filteredEntries, heightCm]);

  const hasData = filteredEntries.length > 0;

  return (
    <div className="weight-chart">
      <div className="weight-chart__tabs">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            className={`weight-chart__tab${range === r.key ? " weight-chart__tab--active" : ""}`}
            onClick={() => setRange(r.key)}
            aria-label={`Show ${r.label} range`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <svg
        className="weight-chart__svg"
        viewBox={`0 0 ${CHART_W} ${totalH}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Weight progress chart"
      >
        {!hasData && (
          <text
            x={CHART_W / 2}
            y={CHART_H / 2}
            textAnchor="middle"
            className="weight-chart__empty-text"
          >
            No data for this period
          </text>
        )}

        {hasData && (
          <>
            {/* Y-axis labels */}
            {yLabels.map((tick, i) => (
              <text
                key={i}
                x={PAD_LEFT - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="weight-chart__axis-label"
              >
                {tick.label}
              </text>
            ))}

            {/* X-axis labels */}
            {xLabels.map((tick, i) => (
              <text
                key={i}
                x={tick.x}
                y={CHART_H - 4}
                textAnchor="middle"
                className="weight-chart__axis-label"
              >
                {tick.label}
              </text>
            ))}

            {/* Grid lines */}
            {yLabels.map((tick, i) => (
              <line
                key={i}
                x1={PAD_LEFT}
                y1={tick.y}
                x2={CHART_W - PAD_RIGHT}
                y2={tick.y}
                className="weight-chart__grid-line"
              />
            ))}

            {/* Goal line */}
            {goalY !== null && (
              <>
                <line
                  x1={PAD_LEFT}
                  y1={goalY}
                  x2={CHART_W - PAD_RIGHT}
                  y2={goalY}
                  className="weight-chart__goal-line"
                />
                <text
                  x={CHART_W - PAD_RIGHT + 2}
                  y={goalY + 4}
                  className="weight-chart__goal-label"
                >
                  GOAL
                </text>
              </>
            )}

            {/* Weight line */}
            <polyline
              points={points}
              className="weight-chart__line"
            />

            {/* Data points */}
            {filteredEntries.map((entry, i) => {
              const plotW = CHART_W - PAD_LEFT - PAD_RIGHT;
              const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;
              const x = filteredEntries.length === 1
                ? PAD_LEFT + plotW / 2
                : PAD_LEFT + (i / (filteredEntries.length - 1)) * plotW;
              const w = convertWeight(entry.weight_kg, unitPref);
              const y = PAD_TOP + plotH - ((w - yMin) / (yMax - yMin)) * plotH;
              return (
                <circle
                  key={entry.id}
                  cx={x}
                  cy={y}
                  r={3}
                  className="weight-chart__dot"
                >
                  <title>{`${entry.recorded_at}: ${formatWeight(entry.weight_kg, unitPref)} ${unitPref}`}</title>
                </circle>
              );
            })}

            {/* BMI trend section */}
            {showBmi && bmiSegments.length > 0 && (
              <>
                {/* Separator line */}
                <line
                  x1={PAD_LEFT}
                  y1={CHART_H + 2}
                  x2={CHART_W - PAD_RIGHT}
                  y2={CHART_H + 2}
                  className="weight-chart__grid-line"
                />
                <text
                  x={PAD_LEFT - 8}
                  y={CHART_H + BMI_SECTION_H / 2 + 4}
                  textAnchor="end"
                  className="weight-chart__bmi-label"
                >
                  BMI
                </text>
                {bmiSegments.map((seg, i) => (
                  <line
                    key={i}
                    x1={seg.x1}
                    y1={seg.y1}
                    x2={seg.x2}
                    y2={seg.y2}
                    stroke={seg.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                ))}
              </>
            )}
          </>
        )}
      </svg>
    </div>
  );
}
