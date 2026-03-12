"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Header from "@/components/Header";

interface WeightEntry {
  id: string;
  weight_kg: number;
  recorded_at: string;
  delta_kg: number;
  fat_mass_kg: number | null;
}

async function loadEntries(): Promise<WeightEntry[]> {
  try {
    const res = await fetch("/api/weight-entries");
    if (res.ok) {
      const data = await res.json();
      return data.entries || [];
    }
  } catch {
    // API not connected
  }
  return [];
}

export default function EntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState("");
  const [fatMass, setFatMass] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const ignore = useRef(false);

  const unit = user?.unit_pref === "lbs" ? "lbs" : "kg";

  useEffect(() => {
    ignore.current = false;
    loadEntries().then((data) => {
      if (!ignore.current) {
        setEntries(data);
        setLoading(false);
      }
    });
    return () => { ignore.current = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const weightNum = parseFloat(weight);
    if (!weightNum || weightNum <= 0) {
      setError("Enter a valid weight");
      setSubmitting(false);
      return;
    }

    // Convert lbs to kg if needed
    const weightKg = unit === "lbs" ? weightNum * 0.453592 : weightNum;
    const fatMassNum = parseFloat(fatMass);
    const fatMassKg = fatMassNum > 0
      ? (unit === "lbs" ? fatMassNum * 0.453592 : fatMassNum)
      : null;

    try {
      const body: Record<string, unknown> = { weight_kg: weightKg, recorded_at: date };
      if (fatMassKg !== null) body.fat_mass_kg = fatMassKg;

      const res = await fetch("/api/weight-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setWeight("");
        setFatMass("");
        const refreshed = await loadEntries();
        setEntries(refreshed);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  };

  const displayWeight = (kg: number) => {
    if (unit === "lbs") return (kg * 2.20462).toFixed(1);
    return Number(kg).toFixed(1);
  };

  const hasFatMassData = entries.some((e) => e.fat_mass_kg != null);

  return (
    <>
    <Header />
    <div className="entries">
      <Link href="/profile" className="back-link" aria-label="Back to Profile">&larr; Back to Profile</Link>
      <h1 className="entries__title">Weight Log</h1>

      <form className="entries__form" onSubmit={handleSubmit}>
        <div className="entries__form-row">
          <div className="entries__field">
            <label className="entries__label" htmlFor="entry-date">Date</label>
            <input
              id="entry-date"
              type="date"
              className="entries__input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="entries__field">
            <label className="entries__label" htmlFor="entry-weight">
              Weight ({unit})
            </label>
            <input
              id="entry-weight"
              type="number"
              step="0.1"
              min="0"
              className="entries__input"
              placeholder={`e.g. ${unit === "kg" ? "82.5" : "181.5"}`}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="entries__field">
            <label className="entries__label" htmlFor="entry-fatmass">
              Fat Mass ({unit}) <span className="entries__optional">optional</span>
            </label>
            <input
              id="entry-fatmass"
              type="number"
              step="0.1"
              min="0"
              className="entries__input"
              placeholder={`e.g. ${unit === "kg" ? "18.0" : "39.7"}`}
              value={fatMass}
              onChange={(e) => setFatMass(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="entries__submit"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Log"}
          </button>
        </div>
        {error && <p className="entries__error">{error}</p>}
      </form>

      <div className="entries__table-wrap">
        {loading ? (
          <p className="entries__empty">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="entries__empty">No entries yet. Log your first weigh-in above.</p>
        ) : (
          <table className="entries__table">
            <thead>
              <tr>
                <th className="entries__th">Date</th>
                <th className="entries__th">Weight</th>
                {hasFatMassData && <th className="entries__th">Fat Mass</th>}
                <th className="entries__th">Change</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="entries__row">
                  <td className="entries__td">{entry.recorded_at}</td>
                  <td className="entries__td">
                    {displayWeight(entry.weight_kg)} {unit}
                  </td>
                  {hasFatMassData && (
                    <td className="entries__td">
                      {entry.fat_mass_kg != null
                        ? `${displayWeight(entry.fat_mass_kg)} ${unit}`
                        : "—"}
                    </td>
                  )}
                  <td
                    className={`entries__td ${
                      entry.delta_kg > 0
                        ? "entries__td--positive"
                        : entry.delta_kg < 0
                        ? "entries__td--negative"
                        : ""
                    }`}
                  >
                    {entry.delta_kg > 0
                      ? `−${displayWeight(entry.delta_kg)}`
                      : entry.delta_kg < 0
                      ? `+${displayWeight(Math.abs(entry.delta_kg))}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </>
  );
}
