"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useAuth } from "@/lib/auth";
import { useBaseName } from "@/hooks/useBaseName";
import { IS_DEV_MODE } from "@/lib/dev";
import WeightChart from "@/components/WeightChart";
import { ChallengesTab } from "@/components/ChallengesTab";

interface WeightEntry {
  id: string;
  weight_kg: number;
  recorded_at: string;
  delta_kg: number;
  fat_mass_kg: number | null;
}

interface Stats {
  totalBurned: number;
  unsubmitted: number;
  submitted: number;
  entryCount: number;
  lastWeight: number | null;
  startWeight: number | null;
  goalWeight: number | null;
}

const PROGRESS_BLOCKS = 20;

function progressColor(pct: number): string {
  // Red (0%) → Yellow (50%) → Green (100%)
  const r = pct < 50 ? 255 : Math.round(255 - (pct - 50) * 5.1);
  const g = pct < 50 ? Math.round(pct * 5.1) : 255;
  return `rgb(${r}, ${g}, 40)`;
}

function ProgressBar({ progress }: { progress: number }) {
  const filled = Math.round((progress / 100) * PROGRESS_BLOCKS);
  const empty = PROGRESS_BLOCKS - filled;
  const color = progressColor(progress);

  return (
    <div className="weight-progress">
      <div className="weight-progress__bar">
        <span style={{ color }}>{"█".repeat(filled)}</span>
        <span className="weight-progress__empty">{"░".repeat(empty)}</span>
      </div>
      <span className="weight-progress__pct" style={{ color }}>{progress}%</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { address } = useAccount();

  // Base name resolution — use connected wallet or session wallet as fallback
  const nameAddress = IS_DEV_MODE
    ? undefined
    : (address ?? (user?.wallet_address as `0x${string}` | undefined));
  const { name: baseName, loading: nameLoading, verify: verifyName } = useBaseName(
    IS_DEV_MODE ? undefined : nameAddress,
  );
  const resolvedBaseName = IS_DEV_MODE ? "devuser.base.eth" : (baseName ?? null);
  const [baseNameInput, setBaseNameInput] = useState("");
  const [baseNameError, setBaseNameError] = useState("");

  // Weight entries for chart
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Dashboard stats
  const [stats, setStats] = useState<Stats>({
    totalBurned: 0,
    unsubmitted: 0,
    submitted: 0,
    entryCount: 0,
    lastWeight: null,
    startWeight: null,
    goalWeight: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [entriesRes, burnRes, submissionsRes] = await Promise.all([
          fetch("/api/weight-entries"),
          fetch("/api/burn-units"),
          fetch("/api/submissions"),
        ]);

        const { entries } = await entriesRes.json();
        const { burn_units } = await burnRes.json();
        const { submissions } = await submissionsRes.json();

        if (cancelled) return;

        setWeightEntries(entries || []);

        const totalBurned = (burn_units || []).reduce(
          (sum: number, b: { kg_amount: number }) => sum + Number(b.kg_amount),
          0,
        );
        const unsubmitted = (burn_units || [])
          .filter((b: { status: string }) => b.status === "unsubmitted")
          .reduce((sum: number, b: { kg_amount: number }) => sum + Number(b.kg_amount), 0);

        const submittedFromBurns = totalBurned - unsubmitted;
        const retroKg = (submissions || [])
          .filter((s: { submission_type: string }) => s.submission_type === "retrospective")
          .reduce((sum: number, s: { kg_total: number }) => sum + Number(s.kg_total), 0);
        const submitted = submittedFromBurns + retroKg;

        setStats({
          totalBurned: totalBurned + retroKg,
          unsubmitted,
          submitted,
          entryCount: entries?.length || 0,
          lastWeight: entries?.[0]?.weight_kg || null,
          startWeight: user?.starting_weight || null,
          goalWeight: user?.goal_weight || null,
        });
        setStatsLoading(false);
      } catch {
        if (!cancelled) setStatsLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [user, refreshKey]);

  const unit = user?.unit_pref === "lbs" ? "lbs" : "kg";

  // Use live user values (not stale stats) so progress updates after profile save
  const startWeightForProgress = user?.starting_weight ?? null;
  const goalWeightForProgress = user?.goal_weight ?? null;
  const progress =
    startWeightForProgress && goalWeightForProgress
      ? Math.min(
          100,
          Math.round(
            ((startWeightForProgress - (stats.lastWeight || startWeightForProgress)) /
              (startWeightForProgress - goalWeightForProgress)) *
              100,
          ),
        )
      : null;

  // Quick weigh-in state
  const [weighInOpen, setWeighInOpen] = useState(false);
  const [weighInWeight, setWeighInWeight] = useState("");
  const [weighInBodyFatPct, setWeighInBodyFatPct] = useState("");
  const [weighInDate, setWeighInDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [weighInSubmitting, setWeighInSubmitting] = useState(false);
  const [weighInError, setWeighInError] = useState("");

  const handleQuickWeighIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setWeighInError("");
    setWeighInSubmitting(true);

    const weightNum = parseFloat(weighInWeight);
    if (!weightNum || weightNum <= 0) {
      setWeighInError("Enter a valid weight");
      setWeighInSubmitting(false);
      return;
    }

    const weightKg = unit === "lbs" ? weightNum * 0.453592 : weightNum;
    const bfPctNum = parseFloat(weighInBodyFatPct);
    const fatMassKg = bfPctNum > 0 && bfPctNum <= 100
      ? weightKg * (bfPctNum / 100)
      : null;

    try {
      const body: Record<string, unknown> = { weight_kg: weightKg, recorded_at: weighInDate };
      if (fatMassKg !== null) body.fat_mass_kg = fatMassKg;

      const res = await fetch("/api/weight-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setWeighInWeight("");
        setWeighInBodyFatPct("");
        setWeighInDate(new Date().toISOString().split("T")[0]);
        setWeighInOpen(false);
        setRefreshKey((k) => k + 1);
      } else {
        const data = await res.json();
        setWeighInError(data.error || "Failed to save");
      }
    } catch {
      setWeighInError("Network error");
    }
    setWeighInSubmitting(false);
  };

  // Body fat % from latest entry
  const bodyFatPercent = useMemo(() => {
    if (weightEntries.length === 0) return null;
    const sorted = [...weightEntries].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
    const withFat = sorted.find((e) => e.fat_mass_kg != null && e.fat_mass_kg > 0);
    if (!withFat || !withFat.fat_mass_kg) return null;
    return (withFat.fat_mass_kg / withFat.weight_kg) * 100;
  }, [weightEntries]);

  // Form state
  const defaults = useMemo(() => ({
    displayName: user?.display_name || "",
    startingWeight: user?.starting_weight?.toString() || "",
    goalWeight: user?.goal_weight?.toString() || "",
    heightCm: user?.height_cm?.toString() || "",
    bodyFatPct: user?.body_fat_pct?.toString() || "",
    unitPref: (user?.unit_pref || "kg") as "kg" | "lbs",
  }), [user]);

  const [displayName, setDisplayName] = useState(defaults.displayName);
  const [baseNameChecked, setBaseNameChecked] = useState(
    () => !!(resolvedBaseName && defaults.displayName && defaults.displayName === resolvedBaseName),
  );
  const [startingWeight, setStartingWeight] = useState(defaults.startingWeight);
  const [goalWeight, setGoalWeight] = useState(defaults.goalWeight);
  const [bodyFatPct, setBodyFatPct] = useState(defaults.bodyFatPct);
  const [unitPref, setUnitPref] = useState<"kg" | "lbs">(defaults.unitPref);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Height — stored as cm internally
  const [heightCm, setHeightCm] = useState(defaults.heightCm);
  const [heightFt, setHeightFt] = useState(() => {
    const cm = parseFloat(defaults.heightCm);
    if (!cm) return "";
    const totalIn = cm / 2.54;
    return Math.floor(totalIn / 12).toString();
  });
  const [heightIn, setHeightIn] = useState(() => {
    const cm = parseFloat(defaults.heightCm);
    if (!cm) return "";
    const totalIn = cm / 2.54;
    return Math.round(totalIn % 12).toString();
  });

  const handleFtChange = (val: string) => {
    setHeightFt(val);
    const ft = parseFloat(val) || 0;
    const inches = parseFloat(heightIn) || 0;
    setHeightCm(Math.round(ft * 30.48 + inches * 2.54).toString());
  };
  const handleInChange = (val: string) => {
    setHeightIn(val);
    const ft = parseFloat(heightFt) || 0;
    const inches = parseFloat(val) || 0;
    setHeightCm(Math.round(ft * 30.48 + inches * 2.54).toString());
  };

  // Base name checkbox handler
  const handleBaseNameToggle = useCallback((checked: boolean) => {
    setBaseNameChecked(checked);
    if (checked && resolvedBaseName) {
      setDisplayName(resolvedBaseName);
    } else if (!checked) {
      setDisplayName("");
      setBaseNameError("");
    }
  }, [resolvedBaseName]);

  // Auto-populate display name when Base Name resolves while checkbox is ticked
  const effectiveDisplayName = baseNameChecked && resolvedBaseName ? resolvedBaseName : displayName;

  // Verify user-entered Base Name
  const handleBaseNameVerify = useCallback(async () => {
    if (!baseNameInput.trim()) return;
    setBaseNameError("");
    const valid = await verifyName(baseNameInput.trim());
    if (!valid) {
      setBaseNameError("Name not found or doesn't match your wallet");
    }
  }, [baseNameInput, verifyName]);

  // Unit toggle with value conversion
  const handleUnitToggle = useCallback((newUnit: "kg" | "lbs") => {
    if (newUnit === unitPref) return;

    const convert = (val: string): string => {
      const n = parseFloat(val);
      if (!n) return val;
      if (newUnit === "lbs") return (n * 2.20462).toFixed(1);
      return (n / 2.20462).toFixed(1);
    };

    setStartingWeight(convert(startingWeight));
    setGoalWeight(convert(goalWeight));

    // Height: KG→LBS recalculates ft/in from cm; LBS→KG keeps cm
    if (newUnit === "lbs" && heightCm) {
      const cm = parseFloat(heightCm);
      if (cm) {
        const totalIn = cm / 2.54;
        setHeightFt(Math.floor(totalIn / 12).toString());
        setHeightIn(Math.round(totalIn % 12).toString());
      }
    }

    setUnitPref(newUnit);
  }, [unitPref, startingWeight, goalWeight, heightCm]);

  // Current weight: latest weigh-in, or starting weight if no entries yet
  const currentWeightDisplay = useMemo(() => {
    const kg = stats.lastWeight ?? user?.starting_weight ?? null;
    if (kg === null) return "—";
    if (unitPref === "lbs") return (kg * 2.20462).toFixed(1);
    return Number(kg).toFixed(1);
  }, [stats.lastWeight, user?.starting_weight, unitPref]);

  // BMI — uses current weight (latest entry), falls back to starting weight
  const currentWeightKg = useMemo(() => {
    if (stats.lastWeight) return stats.lastWeight;
    const sw = parseFloat(startingWeight);
    if (!sw) return null;
    return unitPref === "lbs" ? sw * 0.453592 : sw;
  }, [stats.lastWeight, startingWeight, unitPref]);

  const bmi = useMemo(() => {
    const h = parseFloat(heightCm);
    if (!h || !currentWeightKg || h <= 0) return null;
    const heightM = h / 100;
    return currentWeightKg / (heightM * heightM);
  }, [heightCm, currentWeightKg]);

  const bmiCategory = useMemo(() => {
    if (bmi === null) return null;
    if (bmi < 18.5) return { label: "Underweight", modifier: "underweight" };
    if (bmi < 25) return { label: "Normal", modifier: "normal" };
    if (bmi < 30) return { label: "Overweight", modifier: "overweight" };
    return { label: "Obese", modifier: "obese" };
  }, [bmi]);

  // Body fat % — prefer user's profile value, fallback to latest weight entry calculation
  const effectiveBodyFatPct = useMemo(() => {
    if (user?.body_fat_pct) return user.body_fat_pct;
    return bodyFatPercent;
  }, [user, bodyFatPercent]);

  // Fat mass & lean mass from body fat % + current weight
  const fatMassKg = useMemo(() => {
    if (effectiveBodyFatPct === null || !currentWeightKg) return null;
    return currentWeightKg * (effectiveBodyFatPct / 100);
  }, [effectiveBodyFatPct, currentWeightKg]);

  const leanMassKg = useMemo(() => {
    if (fatMassKg === null || !currentWeightKg) return null;
    return currentWeightKg - fatMassKg;
  }, [fatMassKg, currentWeightKg]);

  const [activeTab, setActiveTab] = useState<"dashboard" | "challenges">("dashboard");
  const [bmiTooltipOpen, setBmiTooltipOpen] = useState(false);
  const [bmiHovered, setBmiHovered] = useState(false);

  // Profile setup: one-time onboarding — form hidden after mandatory fields saved
  const isProfileSetup = !!(user?.starting_weight && user?.goal_weight && user?.height_cm && user?.display_name);
  const [editing, setEditing] = useState(false);
  const showForm = !isProfileSetup || editing;
  const canSave = !!(effectiveDisplayName.trim() && heightCm && startingWeight && goalWeight);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    // Convert weights back to kg for storage if user is in lbs mode
    let swKg = startingWeight ? parseFloat(startingWeight) : null;
    let gwKg = goalWeight ? parseFloat(goalWeight) : null;
    if (unitPref === "lbs") {
      if (swKg) swKg = swKg * 0.453592;
      if (gwKg) gwKg = gwKg * 0.453592;
    }

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: effectiveDisplayName || null,
          starting_weight: swKg,
          goal_weight: gwKg,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          body_fat_pct: bodyFatPct ? parseFloat(bodyFatPct) : null,
          unit_pref: unitPref,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
        setMessage("Profile saved");
        setEditing(false);
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to save");
      }
    } catch {
      setMessage("Network error");
    }
    setSaving(false);
  };

  return (
    <div className="profile">
      <div className="profile-tabs" role="tablist" aria-label="Profile sections">
        <button
          role="tab"
          aria-selected={activeTab === "dashboard"}
          className={`profile-tabs__tab${activeTab === "dashboard" ? " profile-tabs__tab--active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "challenges"}
          className={`profile-tabs__tab${activeTab === "challenges" ? " profile-tabs__tab--active" : ""}`}
          onClick={() => setActiveTab("challenges")}
        >
          Challenges
        </button>
      </div>

      {activeTab === "challenges" && <ChallengesTab />}

      {activeTab === "dashboard" && <>
      <div className="dash-home__greeting">
        <h1 className="dash-home__title">
          {user?.display_name || "Profile"}
        </h1>
        <p className="dash-home__subtitle">Your personal fat burn tracker</p>
        {isProfileSetup && !editing && (
          <button type="button" className="dash-home__edit-profile" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        )}
        <div className="dash-home__metrics">
          <div className="dash-home__metric">
            <span className="dash-home__metric-label">current weight</span>
            <p className="dash-home__current-weight">
              {currentWeightDisplay} <span className="dash-home__current-unit">{unit}</span>
            </p>
          </div>
          <div className="dash-home__metric">
            <span className="dash-home__metric-label">
              bmi
              <span
                className="dash-home__bmi-info-wrap"
                onMouseEnter={() => setBmiHovered(true)}
                onMouseLeave={() => setBmiHovered(false)}
              >
                <button
                  type="button"
                  className="dash-home__bmi-info"
                  onClick={() => setBmiTooltipOpen(!bmiTooltipOpen)}
                  aria-label="BMI info"
                  aria-expanded={bmiTooltipOpen || bmiHovered}
                >
                  &#9432;
                </button>
                {(bmiHovered || bmiTooltipOpen) && (
                  <div className="dash-home__bmi-tooltip" role="tooltip">
                    <span className={`dash-home__bmi-grade${bmi !== null && bmi < 18.5 ? " dash-home__bmi-grade--active" : ""} profile__bmi-label--underweight`}>&lt;18.5 Underweight</span>
                    <span className={`dash-home__bmi-grade${bmi !== null && bmi >= 18.5 && bmi < 25 ? " dash-home__bmi-grade--active" : ""} profile__bmi-label--normal`}>18.5–24.9 Normal</span>
                    <span className={`dash-home__bmi-grade${bmi !== null && bmi >= 25 && bmi < 30 ? " dash-home__bmi-grade--active" : ""} profile__bmi-label--overweight`}>25–29.9 Overweight</span>
                    <span className={`dash-home__bmi-grade${bmi !== null && bmi >= 30 ? " dash-home__bmi-grade--active" : ""} profile__bmi-label--obese`}>30+ Obese</span>
                  </div>
                )}
              </span>
            </span>
            {bmi !== null && bmiCategory ? (
              <div className="dash-home__bmi-display">
                <span className="dash-home__bmi-number">{bmi.toFixed(1)}</span>
                <span className={`dash-home__bmi-category profile__bmi-label--${bmiCategory.modifier}`}>
                  {bmiCategory.label}
                </span>
              </div>
            ) : (
              <p className="dash-home__metric-value dash-home__metric-value--empty">—</p>
            )}
          </div>
          <div className="dash-home__metric">
            <span className="dash-home__metric-label">fat mass</span>
            <p className="dash-home__metric-value">
              {fatMassKg !== null
                ? <>{unitPref === "lbs" ? (fatMassKg * 2.20462).toFixed(1) : fatMassKg.toFixed(1)} <span className="dash-home__current-unit">{unit}</span></>
                : <span className="dash-home__metric-value--empty">—</span>}
            </p>
          </div>
          <div className="dash-home__metric">
            <span className="dash-home__metric-label">lean mass</span>
            <p className="dash-home__metric-value">
              {leanMassKg !== null
                ? <>{unitPref === "lbs" ? (leanMassKg * 2.20462).toFixed(1) : leanMassKg.toFixed(1)} <span className="dash-home__current-unit">{unit}</span></>
                : <span className="dash-home__metric-value--empty">—</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Weight Progress Bar — terminal style */}
      {progress !== null && startWeightForProgress && goalWeightForProgress && (
        <div className="weight-progress-row">
          <div className="weight-progress-row__target">
            <span className="dash-home__metric-label">target weight</span>
            <p className="dash-home__current-weight">
              {unitPref === "lbs"
                ? (goalWeightForProgress * 2.20462).toFixed(1)
                : goalWeightForProgress.toFixed(1)} <span className="dash-home__current-unit">{unit}</span>
            </p>
          </div>
          <ProgressBar progress={Math.max(0, Math.min(100, progress))} />
        </div>
      )}

      {/* Weight Progress Chart */}
      {weightEntries.length > 0 && (
        <WeightChart
          entries={weightEntries}
          goalWeight={user?.goal_weight ?? null}
          unitPref={unitPref}
        />
      )}

      {/* Counter + stats merged in one frame */}
      <div className="dash-home__counter">
        <span className="dash-home__counter-value">
          {statsLoading ? "—" : stats.totalBurned.toFixed(1)}
        </span>
        <span className="dash-home__counter-unit">{unit}</span>
        <span className="dash-home__counter-label">total burned</span>

        <div className="stats-grid">
          <div className="stats-grid__card">
            <span className="stats-grid__value">
              {user?.starting_weight
                ? unitPref === "lbs"
                  ? (user.starting_weight * 2.20462).toFixed(1)
                  : user.starting_weight.toFixed(1)
                : "—"}
            </span>
            <span className="stats-grid__label">
              starting {unit}
            </span>
          </div>
          <div className="stats-grid__card">
            <span className="stats-grid__value">
              {user?.height_cm
                ? unitPref === "lbs"
                  ? `${Math.floor(user.height_cm / 30.48)}'${Math.round((user.height_cm % 30.48) / 2.54)}"`
                  : `${user.height_cm}`
                : "—"}
            </span>
            <span className="stats-grid__label">
              height {unitPref === "lbs" ? "ft/in" : "cm"}
            </span>
          </div>
          <div className="stats-grid__card">
            <span className="stats-grid__value">
              {statsLoading ? "—" : stats.unsubmitted.toFixed(1)}
            </span>
            <span className="stats-grid__label">
              {unit} ready to submit
            </span>
          </div>
          <div className="stats-grid__card">
            <span className="stats-grid__value">
              {statsLoading ? "—" : stats.submitted.toFixed(1)}
            </span>
            <span className="stats-grid__label">
              {unit} on global ledger
            </span>
          </div>
          <div className="stats-grid__card">
            <span className="stats-grid__value">
              {statsLoading ? "—" : stats.entryCount}
            </span>
            <span className="stats-grid__label">weigh-ins</span>
          </div>
          <div className="stats-grid__card">
            <span className="stats-grid__value">
              {progress !== null ? `${progress}%` : "—"}
            </span>
            <span className="stats-grid__label">target progress</span>
          </div>
        </div>
      </div>

      {/* Quick Weigh-In */}
      <div className="quick-weighin">
        <button
          type="button"
          className="quick-weighin__toggle"
          onClick={() => setWeighInOpen(!weighInOpen)}
          aria-expanded={weighInOpen}
          aria-label="Toggle quick weigh-in form"
        >
          {weighInOpen ? "Close" : "New Weigh-In +"}
        </button>

        {weighInOpen && (
          <form className="quick-weighin__form" onSubmit={handleQuickWeighIn}>
            <div className="quick-weighin__row">
              <div className="quick-weighin__field">
                <label className="quick-weighin__label" htmlFor="qw-date">Date</label>
                <input
                  id="qw-date"
                  type="date"
                  className="quick-weighin__input"
                  value={weighInDate}
                  onChange={(e) => setWeighInDate(e.target.value)}
                />
              </div>
              <div className="quick-weighin__field">
                <label className="quick-weighin__label" htmlFor="qw-weight">
                  Weight ({unit})
                </label>
                <input
                  id="qw-weight"
                  type="number"
                  step="0.1"
                  min="0"
                  className="quick-weighin__input"
                  placeholder={unit === "kg" ? "82.5" : "181.5"}
                  value={weighInWeight}
                  onChange={(e) => setWeighInWeight(e.target.value)}
                />
              </div>
              <div className="quick-weighin__field">
                <label className="quick-weighin__label" htmlFor="qw-bodyfat">
                  Body Fat % <span className="quick-weighin__optional">optional</span>
                </label>
                <input
                  id="qw-bodyfat"
                  type="number"
                  step="0.1"
                  min="1"
                  max="70"
                  className="quick-weighin__input"
                  placeholder="22.0"
                  value={weighInBodyFatPct}
                  onChange={(e) => setWeighInBodyFatPct(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="quick-weighin__submit"
                disabled={weighInSubmitting}
              >
                {weighInSubmitting ? "Saving..." : "Log"}
              </button>
            </div>
            {weighInError && <p className="quick-weighin__error">{weighInError}</p>}
          </form>
        )}

        <Link href="/profile/entries" className="quick-weighin__history-link">
          View full history →
        </Link>
      </div>

      {/* Action buttons */}
      <div className="dash-home__actions">
        {stats.unsubmitted > 0 && (
          <Link href="/profile/submit" className="cta">
            Submit {stats.unsubmitted.toFixed(1)} {unit} to Global →
          </Link>
        )}
        {user && !user.has_used_retrospective && (
          <Link href="/profile/retrospective" className="cta cta--inverted">
            Claim Past Fat Loss (50% off) →
          </Link>
        )}
      </div>

      {/* Profile form — visible on first setup or when editing */}
      {showForm && (
      <form className="profile__form" onSubmit={handleSave}>
        {!isProfileSetup && (
          <h2 className="profile__form-title">Set Up Your Profile</h2>
        )}

        {/* Display name + Base name checkbox */}
        <div className="profile__field">
          <label className="profile__label" htmlFor="profile-name">
            Display Name
          </label>
          <input
            id="profile-name"
            type="text"
            className="profile__input"
            placeholder="Your name"
            value={effectiveDisplayName}
            disabled={baseNameChecked}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <label className="profile__basename-check">
            <input
              type="checkbox"
              checked={baseNameChecked}
              onChange={(e) => handleBaseNameToggle(e.target.checked)}
            />
            <span>
              Use Base Name
              {resolvedBaseName ? ` (${resolvedBaseName})` : ""}
            </span>
          </label>
          {baseNameChecked && !resolvedBaseName && (
            <div className="profile__basename-verify">
              <div className="profile__basename-row">
                <input
                  type="text"
                  className="profile__input"
                  placeholder="yourname.base.eth"
                  value={baseNameInput}
                  onChange={(e) => setBaseNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleBaseNameVerify(); } }}
                />
                <button
                  type="button"
                  className="profile__basename-btn"
                  onClick={handleBaseNameVerify}
                  disabled={nameLoading || !baseNameInput.trim()}
                >
                  {nameLoading ? "..." : "Verify"}
                </button>
              </div>
              {baseNameError && <p className="profile__basename-error">{baseNameError}</p>}
            </div>
          )}
        </div>

        {/* Height */}
        <div className="profile__field">
          <label className="profile__label" htmlFor="profile-height">
            Height {unitPref === "kg" ? "(cm)" : "(ft / in)"}
          </label>
          {unitPref === "kg" ? (
            <input
              id="profile-height"
              type="number"
              step="1"
              className="profile__input"
              placeholder="178"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              required
            />
          ) : (
            <div className="profile__height-row">
              <input
                id="profile-height"
                type="number"
                step="1"
                min="0"
                max="8"
                className="profile__input profile__input--short"
                placeholder="5"
                value={heightFt}
                onChange={(e) => handleFtChange(e.target.value)}
                required
              />
              <span className="profile__height-separator">ft</span>
              <input
                type="number"
                step="1"
                min="0"
                max="11"
                className="profile__input profile__input--short"
                placeholder="10"
                value={heightIn}
                onChange={(e) => handleInChange(e.target.value)}
                required
              />
              <span className="profile__height-separator">in</span>
            </div>
          )}
        </div>

        {/* Weight fields */}
        <div className="profile__row">
          <div className="profile__field">
            <label className="profile__label" htmlFor="profile-start">
              Starting Weight ({unitPref})
            </label>
            <input
              id="profile-start"
              type="number"
              step="0.1"
              className="profile__input"
              placeholder={unitPref === "kg" ? "90.0" : "198.0"}
              value={startingWeight}
              onChange={(e) => setStartingWeight(e.target.value)}
              required
            />
          </div>
          <div className="profile__field">
            <label className="profile__label" htmlFor="profile-goal">
              Target Weight ({unitPref})
            </label>
            <input
              id="profile-goal"
              type="number"
              step="0.1"
              className="profile__input"
              placeholder={unitPref === "kg" ? "75.0" : "165.0"}
              value={goalWeight}
              onChange={(e) => setGoalWeight(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Unit toggle */}
        <div className="profile__field">
          <label className="profile__label">Unit Preference</label>
          <div className="profile__toggle">
            <button
              type="button"
              className={`profile__toggle-btn ${unitPref === "kg" ? "profile__toggle-btn--active" : ""}`}
              onClick={() => handleUnitToggle("kg")}
            >
              KG
            </button>
            <button
              type="button"
              className={`profile__toggle-btn ${unitPref === "lbs" ? "profile__toggle-btn--active" : ""}`}
              onClick={() => handleUnitToggle("lbs")}
            >
              LBS
            </button>
          </div>
        </div>

        {/* Body Fat % (optional) */}
        <div className="profile__field">
          <label className="profile__label" htmlFor="profile-bodyfat">
            Body Fat % <span className="profile__optional">optional</span>
          </label>
          <input
            id="profile-bodyfat"
            type="number"
            step="0.1"
            min="1"
            max="70"
            className="profile__input"
            placeholder="22.0"
            value={bodyFatPct}
            onChange={(e) => setBodyFatPct(e.target.value)}
          />
        </div>

        <button type="submit" className="profile__save" disabled={saving || !canSave}>
          {saving ? "Saving..." : isProfileSetup ? "Update Profile" : "Save Profile"}
        </button>
        {editing && (
          <button type="button" className="profile__cancel" onClick={() => setEditing(false)}>
            Cancel
          </button>
        )}

        {message && (
          <p className={`profile__message ${message === "Profile saved" ? "profile__message--success" : "profile__message--error"}`}>
            {message}
          </p>
        )}
      </form>
      )}

      </>}

    </div>
  );
}
