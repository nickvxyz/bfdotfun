"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { base } from "wagmi/chains";
import { useName } from "@coinbase/onchainkit/identity";
import { useAuth } from "@/lib/auth";
import { IS_DEV_MODE } from "@/lib/dev";

interface Stats {
  totalBurned: number;
  unsubmitted: number;
  submitted: number;
  entryCount: number;
  lastWeight: number | null;
  startWeight: number | null;
  goalWeight: number | null;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { address } = useAccount();

  // Base name resolution
  const { data: baseName } = useName(
    { address: IS_DEV_MODE ? undefined : address, chain: base },
    { enabled: !IS_DEV_MODE && !!address },
  );
  const resolvedBaseName = IS_DEV_MODE ? "devuser.base.eth" : (baseName ?? null);

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
    async function fetchStats() {
      try {
        const [entriesRes, burnRes, submissionsRes] = await Promise.all([
          fetch("/api/weight-entries"),
          fetch("/api/burn-units"),
          fetch("/api/submissions"),
        ]);

        const { entries } = await entriesRes.json();
        const { burn_units } = await burnRes.json();
        const { submissions } = await submissionsRes.json();

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

        if (!cancelled) {
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
        }
      } catch {
        if (!cancelled) setStatsLoading(false);
      }
    }
    fetchStats();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unit = user?.unit_pref === "lbs" ? "lbs" : "kg";
  const progress =
    stats.startWeight && stats.goalWeight
      ? Math.min(
          100,
          Math.round(
            ((stats.startWeight - (stats.lastWeight || stats.startWeight)) /
              (stats.startWeight - stats.goalWeight)) *
              100,
          ),
        )
      : null;

  // Form state
  const defaults = useMemo(() => ({
    displayName: user?.display_name || "",
    startingWeight: user?.starting_weight?.toString() || "",
    goalWeight: user?.goal_weight?.toString() || "",
    heightCm: user?.height_cm?.toString() || "",
    unitPref: (user?.unit_pref || "kg") as "kg" | "lbs",
  }), [user]);

  const [displayName, setDisplayName] = useState(defaults.displayName);
  const [useBaseName, setUseBaseName] = useState(
    () => !!(resolvedBaseName && defaults.displayName && defaults.displayName === resolvedBaseName),
  );
  const [startingWeight, setStartingWeight] = useState(defaults.startingWeight);
  const [goalWeight, setGoalWeight] = useState(defaults.goalWeight);
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
    setUseBaseName(checked);
    if (checked && resolvedBaseName) {
      setDisplayName(resolvedBaseName);
    }
  }, [resolvedBaseName]);

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

  const [bmiTooltipOpen, setBmiTooltipOpen] = useState(false);
  const [bmiHovered, setBmiHovered] = useState(false);

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
          display_name: displayName || null,
          starting_weight: swKg,
          goal_weight: gwKg,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          unit_pref: unitPref,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
        setMessage("Profile saved");
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
      <div className="dash-home__greeting">
        <h1 className="dash-home__title">
          {user?.display_name || "Profile"}
        </h1>
        <p className="dash-home__subtitle">Your personal fat burn tracker</p>
        <div className="dash-home__metrics">
          <div className="dash-home__metric">
            <span className="dash-home__metric-label">current weight</span>
            <p className="dash-home__current-weight">
              {currentWeightDisplay} <span className="dash-home__current-unit">{unit}</span>
            </p>
          </div>
          {bmi !== null && bmiCategory && (
            <div className="dash-home__metric">
              <span className="dash-home__metric-label">bmi</span>
              <div className="dash-home__bmi-display">
                <span className="dash-home__bmi-number">{bmi.toFixed(1)}</span>
                <span className={`dash-home__bmi-category profile__bmi-label--${bmiCategory.modifier}`}>
                  {bmiCategory.label}
                </span>
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
                      <span className={`dash-home__bmi-grade${bmi < 18.5 ? " dash-home__bmi-grade--active" : ""} profile__bmi-label--underweight`}>&lt;18.5 Underweight</span>
                      <span className={`dash-home__bmi-grade${bmi >= 18.5 && bmi < 25 ? " dash-home__bmi-grade--active" : ""} profile__bmi-label--normal`}>18.5–24.9 Normal</span>
                      <span className={`dash-home__bmi-grade${bmi >= 25 && bmi < 30 ? " dash-home__bmi-grade--active" : ""} profile__bmi-label--overweight`}>25–29.9 Overweight</span>
                      <span className={`dash-home__bmi-grade${bmi >= 30 ? " dash-home__bmi-grade--active" : ""} profile__bmi-label--obese`}>30+ Obese</span>
                    </div>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

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
            <span className="stats-grid__label">goal progress</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="dash-home__actions">
        <Link href="/profile/entries" className="cta cta--inverted">
          New Weigh-In +
        </Link>
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

      {/* Profile form */}
      <form className="profile__form" onSubmit={handleSave}>
        {/* Display name + Base name checkbox */}
        <div className="profile__field">
          <label className="profile__label" htmlFor="profile-name">
            Display Name
          </label>
          <input
            id="profile-name"
            type="text"
            className="profile__input"
            placeholder="anon"
            value={displayName}
            disabled={useBaseName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <label className="profile__basename-check">
            <input
              type="checkbox"
              checked={useBaseName}
              disabled={!resolvedBaseName}
              onChange={(e) => handleBaseNameToggle(e.target.checked)}
            />
            <span>Use Base Name{resolvedBaseName ? ` (${resolvedBaseName})` : ""}</span>
          </label>
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
            />
          </div>
          <div className="profile__field">
            <label className="profile__label" htmlFor="profile-goal">
              Goal Weight ({unitPref})
            </label>
            <input
              id="profile-goal"
              type="number"
              step="0.1"
              className="profile__input"
              placeholder={unitPref === "kg" ? "75.0" : "165.0"}
              value={goalWeight}
              onChange={(e) => setGoalWeight(e.target.value)}
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

        <button type="submit" className="profile__save" disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>

        {message && (
          <p className={`profile__message ${message === "Profile saved" ? "profile__message--success" : "profile__message--error"}`}>
            {message}
          </p>
        )}
      </form>

    </div>
  );
}
