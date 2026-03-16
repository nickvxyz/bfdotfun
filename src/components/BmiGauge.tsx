"use client";

import { useEffect, useState, useRef, useCallback } from "react";

// Arc geometry
const ARC_START = Math.PI * 0.75;
const ARC_END = Math.PI * 2.25;
const CX = 120;
const CY = 120;
const R = 100;
const BMI_MIN = 12;
const BMI_MAX = 45;

function bmiToAngle(bmi: number): number {
  const clamped = Math.max(BMI_MIN, Math.min(BMI_MAX, bmi));
  return ARC_START + ((clamped - BMI_MIN) / (BMI_MAX - BMI_MIN)) * (ARC_END - ARC_START);
}

function polarToXY(angle: number, radius: number): [number, number] {
  return [CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius];
}

function arcPath(startAngle: number, endAngle: number, radius: number): string {
  const [x1, y1] = polarToXY(startAngle, radius);
  const [x2, y2] = polarToXY(endAngle, radius);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function getBmiColor(bmi: number): string {
  if (bmi < 18.5) return "#888880";
  if (bmi < 25) return "#00ff88";
  if (bmi < 30) return "#f7e709";
  return "#ff4444";
}

function getBmiVerdict(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "UNDERWEIGHT", color: "#888880" };
  if (bmi < 25) return { label: "NORMAL", color: "#00ff88" };
  if (bmi < 30) return { label: "OVERWEIGHT", color: "#f7e709" };
  return { label: "OBESE", color: "#ff4444" };
}

const ZONES = [
  { end: 18.5, color: "#888880" },
  { end: 25, color: "#00ff88" },
  { end: 30, color: "#f7e709" },
  { end: 45, color: "#ff4444" },
];

type Phase = "scanning" | "measuring" | "verdict";

function GaugeInner({
  bmi,
  onVerdictReady,
}: {
  bmi: number;
  onVerdictReady?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("scanning");
  const [needleAngle, setNeedleAngle] = useState(ARC_START);
  const [displayBmi, setDisplayBmi] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [showVerdict, setShowVerdict] = useState(false);
  const frameRef = useRef(0);
  const animRef = useRef<(() => void) | null>(null);

  const finalColor = getBmiColor(bmi);
  const verdict = getBmiVerdict(bmi);

  const tick = useCallback(() => {
    if (animRef.current) animRef.current();
  }, []);

  useEffect(() => {
    const SCAN_DURATION = 1500;
    const MEASURE_DURATION = 2200;
    const ta = bmiToAngle(bmi);
    const start = performance.now();

    animRef.current = () => {
      const elapsed = performance.now() - start;

      if (elapsed < SCAN_DURATION) {
        const jitterVal = Math.sin(elapsed * 0.015) * 0.12 + Math.sin(elapsed * 0.037) * 0.06;
        setPhase("scanning");
        setJitter(jitterVal);
        setNeedleAngle(ARC_START + jitterVal);
        setDisplayBmi(0);
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const measureElapsed = elapsed - SCAN_DURATION;
      if (measureElapsed < MEASURE_DURATION) {
        const t = measureElapsed / MEASURE_DURATION;
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        setPhase("measuring");
        setJitter(0);
        setNeedleAngle(ARC_START + (ta - ARC_START) * eased);
        setDisplayBmi(Math.round((BMI_MIN + (bmi - BMI_MIN) * eased) * 10) / 10);
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      setPhase("verdict");
      setNeedleAngle(ta);
      setDisplayBmi(Math.round(bmi * 10) / 10);
      setTimeout(() => {
        setShowVerdict(true);
        onVerdictReady?.();
      }, 400);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [bmi, tick, onVerdictReady]);

  const [nx, ny] = polarToXY(needleAngle, R - 8);
  const activeColor = phase === "scanning" ? "var(--c-ember)" : getBmiColor(displayBmi || BMI_MIN);
  const activeArc = needleAngle > ARC_START + 0.01 ? arcPath(ARC_START, needleAngle, R) : "";

  return (
    <div className="bmi-gauge">
      <svg viewBox="0 0 240 195" className="bmi-gauge__svg">
        <defs>
          <filter id="gauge-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="gauge-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background zone arcs */}
        {ZONES.map((zone, i) => {
          const prevEnd = i === 0 ? BMI_MIN : ZONES[i - 1].end;
          return (
            <path
              key={i}
              d={arcPath(bmiToAngle(prevEnd), bmiToAngle(zone.end), R)}
              fill="none"
              stroke={zone.color}
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.12"
            />
          );
        })}

        {/* Active arc */}
        {activeArc && (
          <path
            d={activeArc}
            fill="none"
            stroke={activeColor}
            strokeWidth="6"
            strokeLinecap="round"
            filter={phase === "verdict" ? "url(#gauge-glow-strong)" : "url(#gauge-glow)"}
          />
        )}

        {/* Tick marks */}
        {[18.5, 25, 30].map((tick) => {
          const angle = bmiToAngle(tick);
          const [tx1, ty1] = polarToXY(angle, R + 8);
          const [tx2, ty2] = polarToXY(angle, R - 8);
          return (
            <line
              key={tick}
              x1={tx1} y1={ty1} x2={tx2} y2={ty2}
              stroke="#888880" strokeWidth="1" opacity="0.3"
            />
          );
        })}

        {/* Needle dot */}
        <circle
          cx={nx} cy={ny}
          r={phase === "verdict" ? 6 : 4}
          fill={activeColor}
          filter={phase === "verdict" ? "url(#gauge-glow-strong)" : "url(#gauge-glow)"}
        />

        {/* Center content */}
        {phase === "scanning" ? (
          <text
            x={CX} y={CY + 2}
            textAnchor="middle" dominantBaseline="central"
            fill="var(--c-muted)" fontSize="11"
            fontFamily="var(--font-title), Orbitron, sans-serif"
            fontWeight="700" letterSpacing="3"
            opacity={0.5 + Math.abs(jitter) * 3}
          >
            SCANNING
          </text>
        ) : (
          <>
            <text
              x={CX} y={CY - 8}
              textAnchor="middle" dominantBaseline="central"
              fill={phase === "verdict" ? finalColor : activeColor}
              fontSize="44"
              fontFamily="var(--font-title), Orbitron, sans-serif"
              fontWeight="900"
              filter={phase === "verdict" ? "url(#gauge-glow-strong)" : "url(#gauge-glow)"}
            >
              {displayBmi.toFixed(1)}
            </text>
            <text
              x={CX} y={CY + 26}
              textAnchor="middle" fill="#888880" fontSize="10"
              fontFamily="var(--font-title), Orbitron, sans-serif"
              fontWeight="700" letterSpacing="3"
            >
              BMI
            </text>
          </>
        )}

        {/* Zone labels */}
        <text x="28" y="180" fill="#888880" fontSize="7" fontFamily="var(--font-body), Space Mono, monospace" opacity="0.5">UNDER</text>
        <text x="80" y="193" fill="#00ff88" fontSize="7" fontFamily="var(--font-body), Space Mono, monospace" opacity="0.5">NORMAL</text>
        <text x="138" y="193" fill="#f7e709" fontSize="7" fontFamily="var(--font-body), Space Mono, monospace" opacity="0.5">OVER</text>
        <text x="194" y="180" fill="#ff4444" fontSize="7" fontFamily="var(--font-body), Space Mono, monospace" opacity="0.5">OBESE</text>
      </svg>

      {/* Verdict — massive, slams in */}
      {showVerdict && (
        <div className="bmi-gauge__verdict" style={{ color: verdict.color }}>
          <span
            className="bmi-gauge__verdict-text"
            style={{ textShadow: `0 0 60px ${verdict.color}, 0 0 120px ${verdict.color}40` }}
          >
            {verdict.label}
          </span>
        </div>
      )}
    </div>
  );
}

// Wrapper that forces remount on bmi change for clean animation restart
export default function BmiGauge({
  bmi,
  onVerdictReady,
}: {
  bmi: number;
  onVerdictReady?: () => void;
}) {
  return <GaugeInner key={bmi} bmi={bmi} onVerdictReady={onVerdictReady} />;
}
