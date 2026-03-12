"use client";

import { useState, useEffect, useRef } from "react";

// --- Types ---

interface FeedEntry {
  id: string;
  display_name: string | null;
  wallet_address: string;
  kg_total: number | null;
  submission_type: string | null;
  created_at: string;
  type: "burned" | "joined";
}

interface FeedItem {
  id: string;
  name: string;
  action: string;
  color: string;
  icon: string;
}

// --- Constants ---

const VISIBLE_COUNT = 3;
const ITEM_HEIGHT = 80; // 72px item + 8px gap
const ANIM_DURATION = 500;
const ANIM_STAGGER = 300;

// --- Helpers ---

function abbreviateWallet(address: string): string {
  if (!address || address.length < 10) return "anon";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getDisplayName(entry: FeedEntry): string {
  if (entry.display_name) return entry.display_name;
  if (entry.wallet_address) return abbreviateWallet(entry.wallet_address);
  return "anon";
}

function entryToFeedItem(entry: FeedEntry): FeedItem {
  const name = getDisplayName(entry);

  if (entry.type === "joined") {
    return {
      id: entry.id,
      name,
      action: "joined the crew",
      color: "banner--green",
      icon: "user-plus",
    };
  }

  const kg = entry.kg_total ?? 0;

  if (entry.submission_type === "weight_logged") {
    return {
      id: entry.id,
      name,
      action: `new weigh-in${kg > 0 ? ` — ${kg} kg burned` : ""}`,
      color: "banner--orange",
      icon: "check",
    };
  }

  return {
    id: entry.id,
    name,
    action: `burned ${kg} kg on the ledger`,
    color: "banner--orange",
    icon: "bolt",
  };
}

// Deterministic initial items (avoids SSR hydration mismatch)
const INITIAL_ITEMS: FeedItem[] = [
  { id: "init-0", name: "loading...", action: "fetching live data", color: "banner--orange", icon: "check" },
];

// --- Icons ---

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
};

function formatNumber(num: number, digits: number = 9) {
  const rounded = (Math.round(num * 10) / 10).toFixed(1);
  const [intPart, decPart] = rounded.split(".");
  const padded = intPart.padStart(digits, "0");
  const withCommas = padded.replace(/(\d{3})(?=\d)/g, "$1,");
  return `${withCommas}.${decPart}`;
}

// --- Component ---

export default function LiveCounter({ hook, label }: { hook?: string; label?: string }) {
  const [counterValue, setCounterValue] = useState(0);

  // Fetch real counter value on mount + poll every 20s
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

  const [items, setItems] = useState<FeedItem[]>(INITIAL_ITEMS);
  const [enterId, setEnterId] = useState<string | null>(null);
  const [feedLoaded, setFeedLoaded] = useState(false);

  const knownIds = useRef<Set<string>>(new Set());
  const animTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Fetch real feed data + poll every 20s — event-driven animation
  useEffect(() => {
    async function fetchFeed() {
      try {
        const res = await fetch("/api/feed");
        if (!res.ok) return;

        const data = await res.json();
        const entries: FeedEntry[] = data.feed ?? [];

        if (entries.length === 0 && !feedLoaded) {
          setItems([{
            id: "empty",
            name: "",
            action: "No submissions yet — be the first!",
            color: "banner--orange",
            icon: "bolt",
          }]);
          setFeedLoaded(true);
          return;
        }

        const feedItems = entries.map(entryToFeedItem);

        if (!feedLoaded) {
          // Initial load — show first batch, no animation
          feedItems.forEach((item) => knownIds.current.add(item.id));
          setItems(feedItems.slice(0, VISIBLE_COUNT));
          setFeedLoaded(true);
          return;
        }

        // Find genuinely new items (IDs not seen before)
        const newItems = feedItems.filter((item) => !knownIds.current.has(item.id));
        feedItems.forEach((item) => knownIds.current.add(item.id));

        if (newItems.length === 0) return;

        // Animate new items in one by one, staggered
        // Clear any pending animation timers
        animTimers.current.forEach(clearTimeout);
        animTimers.current = [];

        newItems.forEach((newItem, i) => {
          const timer = setTimeout(() => {
            setEnterId(newItem.id);
            setItems((prev) => [newItem, ...prev.slice(0, VISIBLE_COUNT)]);

            const clearTimer = setTimeout(() => {
              setEnterId(null);
              setItems((prev) => prev.slice(0, VISIBLE_COUNT));
            }, ANIM_DURATION);
            animTimers.current.push(clearTimer);
          }, i * ANIM_STAGGER);
          animTimers.current.push(timer);
        });
      } catch {
        // Keep current state
      }
    }
    fetchFeed();
    const interval = setInterval(fetchFeed, 20_000);
    return () => {
      clearInterval(interval);
      animTimers.current.forEach(clearTimeout);
    };
  }, [feedLoaded]);

  return (
    <>
      {label !== "" && <p className="counter-section__label">{label ?? "Community Progress"}</p>}
      <p className="counter-section__hook">{hook ?? "A shared total, growing over time"}</p>

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
        <span className="counter__label">total fat burned by humans</span>
      </div>

      <div className="ticker" aria-live="polite">
        <p className="ticker__label">Burn Feed</p>
        <div className="ticker__container">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`banner ${item.color}${
                item.id === enterId ? " banner--enter" : ""
              }${index >= VISIBLE_COUNT ? " banner--exit" : ""}`}
              style={{ transform: `translateY(${index * ITEM_HEIGHT}px)` }}
              aria-hidden={index >= VISIBLE_COUNT}
            >
              <div className="banner__icon">
                {ICONS[item.icon]}
              </div>
              <div className="banner__content">
                <p className="banner__name">{item.name}</p>
                <p className="banner__action">{item.action}</p>
              </div>
            </div>
          ))}
          <div className="ticker__fade" />
        </div>
      </div>
    </>
  );
}
