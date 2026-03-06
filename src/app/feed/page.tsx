"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";

const PSEUDONYMS = [
  "anon.base.eth", "nickv.base.eth", "chad.base.eth", "fitness.base.eth",
  "burner420.base.eth", "maria.base.eth", "coach_k.base.eth", "noexcuses.base.eth",
  "letsgo.base.eth", "whale.base.eth", "grind.base.eth", "healthnut.base.eth",
  "bigmac.base.eth", "runner.base.eth", "yogafan.base.eth", "ironwill.base.eth",
];

type ActionType = "burned" | "joined" | "committed" | "milestone";

const ACTION_WEIGHTS: [ActionType, number][] = [
  ["burned", 0.45],
  ["joined", 0.2],
  ["committed", 0.2],
  ["milestone", 0.15],
];

interface FeedEntry {
  id: number;
  name: string;
  action: string;
  color: string;
  icon: string;
  kgDelta: number;
  timestamp: string;
}

function pickWeighted(): ActionType {
  const r = Math.random();
  let sum = 0;
  for (const [type, weight] of ACTION_WEIGHTS) {
    sum += weight;
    if (r < sum) return type;
  }
  return "burned";
}

function timeAgo(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function generateEntry(lastPseudonym: string, id: number, secsAgo: number): FeedEntry {
  let name: string;
  do {
    name = PSEUDONYMS[Math.floor(Math.random() * PSEUDONYMS.length)];
  } while (name === lastPseudonym);

  const actionType = pickWeighted();
  const timestamp = timeAgo(secsAgo);

  switch (actionType) {
    case "burned": {
      const kg = Math.round((Math.random() * 7.5 + 0.5) * 10) / 10;
      return { id, name, action: `burned ${kg} kg fat`, color: "feed__item--orange", icon: "check", kgDelta: kg, timestamp };
    }
    case "joined":
      return { id, name, action: "joined the crew", color: "feed__item--green", icon: "user-plus", kgDelta: 0, timestamp };
    case "committed": {
      const kg = Math.floor(Math.random() * 14) + 2;
      return { id, name, action: `committed to burn ${kg} kg`, color: "feed__item--yellow", icon: "bolt", kgDelta: 0, timestamp };
    }
    case "milestone": {
      const milestones = ["hit 10 kg burned", "hit 25 kg burned", "hit 50 kg total", "reached target weight"];
      const m = milestones[Math.floor(Math.random() * milestones.length)];
      return { id, name, action: m, color: "feed__item--green", icon: "trophy", kgDelta: 0, timestamp };
    }
  }
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

const INITIAL_COUNT = 20;

function generateInitialFeed(): FeedEntry[] {
  const entries: FeedEntry[] = [];
  let lastPseudonym = "";
  for (let i = 0; i < INITIAL_COUNT; i++) {
    const secsAgo = i * 15 + Math.floor(Math.random() * 10);
    const entry = generateEntry(lastPseudonym, i, secsAgo);
    lastPseudonym = entry.name;
    entries.push(entry);
  }
  return entries;
}

// Deterministic initial entries for SSR
const SSR_ENTRIES: FeedEntry[] = [
  { id: 0, name: "anon.base.eth", action: "burned 3.2 kg fat", color: "feed__item--orange", icon: "check", kgDelta: 3.2, timestamp: "just now" },
  { id: 1, name: "nickv.base.eth", action: "joined the crew", color: "feed__item--green", icon: "user-plus", kgDelta: 0, timestamp: "12s ago" },
  { id: 2, name: "chad.base.eth", action: "committed to burn 7 kg", color: "feed__item--yellow", icon: "bolt", kgDelta: 0, timestamp: "28s ago" },
  { id: 3, name: "fitness.base.eth", action: "burned 1.8 kg fat", color: "feed__item--orange", icon: "check", kgDelta: 1.8, timestamp: "45s ago" },
  { id: 4, name: "maria.base.eth", action: "hit 25 kg burned", color: "feed__item--green", icon: "trophy", kgDelta: 0, timestamp: "1m ago" },
];

export default function FeedPage() {
  const [entries, setEntries] = useState<FeedEntry[]>(SSR_ENTRIES);
  const nextId = useRef(INITIAL_COUNT);
  const lastPseudonym = useRef("");
  const tickTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Generate random initial feed, then start live ticker
    const initial = generateInitialFeed();
    lastPseudonym.current = initial[0]?.name ?? "";
    nextId.current = initial.length;

    // Use a 0ms timeout to avoid synchronous setState in effect
    const hydrationTimeout = setTimeout(() => {
      setEntries(initial);
    }, 0);

    function scheduleNext() {
      const delay = 2000 + Math.random() * 3000;
      tickTimeout.current = setTimeout(() => {
        const id = nextId.current++;
        const entry = generateEntry(lastPseudonym.current, id, 0);
        entry.timestamp = "just now";
        lastPseudonym.current = entry.name;
        setEntries(prev => [entry, ...prev.slice(0, 49)]);
        scheduleNext();
      }, delay);
    }

    // Start ticker after initial hydration settles
    const startTimeout = setTimeout(() => {
      scheduleNext();
    }, 100);

    return () => {
      clearTimeout(hydrationTimeout);
      clearTimeout(startTimeout);
      if (tickTimeout.current) clearTimeout(tickTimeout.current);
    };
  }, []);

  return (
    <>
      <Header />
      <div className="feed page-body">
        <div className="feed__header">
          <h1 className="feed__title">Live Feed</h1>
          <p className="feed__subtitle">Real-time activity from the burn ledger</p>
        </div>

        <div className="feed__list">
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
