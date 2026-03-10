"use client";

import { useState, useEffect, useCallback } from "react";

interface FeedEntry {
  id: string;
  display_name: string;
  delta_kg: number;
  recorded_at: string;
}

interface ChallengeFeedProps {
  slug: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ChallengeFeed({ slug }: ChallengeFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/challenges/${slug}/feed`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load feed");
      }
      const data = await res.json();
      setEntries(data.entries || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEntries();
    const interval = setInterval(fetchEntries, 30000);
    return () => clearInterval(interval);
  }, [fetchEntries]);

  if (loading) {
    return (
      <div className="challenge-feed">
        <p className="challenge-feed__loading">Loading activity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="challenge-feed">
        <p className="challenge-feed__error">{error}</p>
      </div>
    );
  }

  return (
    <div className="challenge-feed">
      <h3 className="challenge-feed__title">Recent Activity</h3>
      {entries.length === 0 ? (
        <p className="challenge-feed__empty">No entries yet. Be the first to log a weigh-in!</p>
      ) : (
        <ul className="challenge-feed__list" aria-label="Challenge activity feed">
          {entries.map((entry) => (
            <li key={entry.id} className="challenge-feed__item">
              <span className="challenge-feed__name">{entry.display_name || "Anonymous"}</span>
              <span className="challenge-feed__action">
                {Number(entry.delta_kg) > 0 ? " lost " : " logged "}
                <span className="challenge-feed__amount">{Math.abs(Number(entry.delta_kg)).toFixed(1)} kg</span>
              </span>
              <span className="challenge-feed__date">{formatDate(entry.recorded_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
