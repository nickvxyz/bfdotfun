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
const ROTATE_INTERVAL = 3000;
const ANIM_DURATION = 500;

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
  return {
    id: entry.id,
    name,
    action: `burned ${kg} kg fat`,
    color: "banner--orange",
    icon: "check",
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

function formatNumber(num: number) {
  const rounded = (Math.round(num * 10) / 10).toFixed(1);
  const [intPart, decPart] = rounded.split(".");
  const padded = intPart.padStart(9, "0");
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
  const [emptyFeed, setEmptyFeed] = useState(false);

  const allItems = useRef<FeedItem[]>([]);
  const rotateIndex = useRef(0);
  const tickTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cleanupTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch real feed data + poll every 20s
  useEffect(() => {
    async function fetchFeed() {
      try {
        const res = await fetch("/api/feed");
        if (!res.ok) return;

        const data = await res.json();
        const entries: FeedEntry[] = data.feed ?? [];

        if (entries.length === 0) {
          setEmptyFeed(true);
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
        allItems.current = feedItems;

        // Show first batch (only reset visible items on initial load)
        if (!feedLoaded) {
          rotateIndex.current = 0;
          setItems(feedItems.slice(0, VISIBLE_COUNT));
        }
        setFeedLoaded(true);
      } catch {
        // Keep initial placeholder
      }
    }
    fetchFeed();
    const interval = setInterval(fetchFeed, 20_000);
    return () => clearInterval(interval);
  }, [feedLoaded]);

  // Rotate through feed items
  useEffect(() => {
    if (!feedLoaded || emptyFeed || allItems.current.length <= VISIBLE_COUNT) return;

    function tick() {
      const pool = allItems.current;
      if (pool.length === 0) return;

      rotateIndex.current = (rotateIndex.current + 1) % pool.length;
      const nextItem = pool[rotateIndex.current];

      setEnterId(nextItem.id);
      setItems(prev => [nextItem, ...prev.slice(0, VISIBLE_COUNT)]);

      cleanupTimeout.current = setTimeout(() => {
        setEnterId(null);
        setItems(prev => prev.slice(0, VISIBLE_COUNT));
      }, ANIM_DURATION);
    }

    function scheduleNext() {
      tickTimeout.current = setTimeout(() => {
        tick();
        scheduleNext();
      }, ROTATE_INTERVAL);
    }

    scheduleNext();
    return () => {
      if (tickTimeout.current) clearTimeout(tickTimeout.current);
      if (cleanupTimeout.current) clearTimeout(cleanupTimeout.current);
    };
  }, [feedLoaded, emptyFeed]);

  return (
    <>
      {label !== "" && <p className="counter-section__label">{label ?? "Community Progress"}</p>}
      <p className="counter-section__hook">{hook ?? "A shared total, growing over time"}</p>

      <div className="counter">
        <div className="counter__row">
          <span className="counter__number">
            {formatNumber(counterValue)}
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
