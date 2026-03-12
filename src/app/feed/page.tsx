"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import BackToProfile from "@/components/BackToProfile";

interface FeedEntry {
  id: string;
  display_name: string | null;
  wallet_address: string;
  kg_total: number | null;
  submission_type: string | null;
  created_at: string;
  type: "burned" | "joined";
}

interface DisplayEntry {
  id: string;
  name: string;
  action: string;
  color: string;
  icon: string;
  timestamp: string;
}

function abbreviateWallet(address: string): string {
  if (!address || address.length < 10) return "anon";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getDisplayName(entry: FeedEntry): string {
  if (entry.display_name) return entry.display_name;
  if (entry.wallet_address) return abbreviateWallet(entry.wallet_address);
  return "anon";
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function entryToDisplay(entry: FeedEntry): DisplayEntry {
  const name = getDisplayName(entry);
  const timestamp = timeAgo(entry.created_at);

  if (entry.type === "joined") {
    return {
      id: entry.id,
      name,
      action: "joined the crew",
      color: "feed__item--green",
      icon: "user-plus",
      timestamp,
    };
  }

  const kg = entry.kg_total ?? 0;

  if (entry.submission_type === "weight_logged") {
    return {
      id: entry.id,
      name,
      action: "new weigh-in",
      color: "feed__item--yellow",
      icon: "check",
      timestamp,
    };
  }

  return {
    id: entry.id,
    name,
    action: `burned ${kg} kg fat`,
    color: "feed__item--orange",
    icon: "check",
    timestamp,
  };
}

const ICONS: Record<string, React.ReactNode> = {
  "user-plus": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
};

export default function FeedPage() {
  const [entries, setEntries] = useState<DisplayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeed() {
      try {
        const res = await fetch("/api/feed");
        if (!res.ok) {
          setError("Failed to load feed");
          setLoading(false);
          return;
        }

        const data = await res.json();
        const feedEntries: FeedEntry[] = data.feed ?? [];
        setEntries(feedEntries.map(entryToDisplay));
        setError(null);
      } catch {
        setError("Failed to load feed");
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
    const interval = setInterval(fetchFeed, 15_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Header />
      <div className="feed page-body">
        <BackToProfile />
        <div className="feed__header">
          <h1 className="feed__title">Live Feed</h1>
          <p className="feed__subtitle">Real-time activity from the burn ledger</p>
        </div>

        <div className="feed__list">
          {loading && (
            <div className="feed__empty">
              <p className="feed__empty-text">Loading feed...</p>
            </div>
          )}

          {!loading && error && (
            <div className="feed__empty">
              <p className="feed__empty-text">{error}</p>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className="feed__empty">
              <p className="feed__empty-text">No submissions yet — be the first!</p>
            </div>
          )}

          {entries.map((entry) => (
            <div key={entry.id} className={`feed__item ${entry.color}`}>
              <div className="feed__item-icon">
                {ICONS[entry.icon]}
              </div>
              <div className="feed__item-content">
                <p className="feed__item-name">{entry.name}</p>
                <p className="feed__item-action">{entry.action}</p>
              </div>
              <span className="feed__item-time">{entry.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
