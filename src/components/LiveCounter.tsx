"use client";

import { useState, useEffect, useRef } from "react";

// --- Data Layer (swap this for real data later) ---

const PSEUDONYMS = [
  "anon.base.eth", "nickv.base.eth", "chad.base.eth", "fitness.base.eth",
  "burner420.base.eth", "maria.base.eth", "coach_k.base.eth", "noexcuses.base.eth",
  "letsgo.base.eth", "whale.base.eth", "grind.base.eth", "healthnut.base.eth",
];

type ActionType = "burned" | "joined" | "committed";

const ACTION_WEIGHTS: [ActionType, number][] = [
  ["burned", 0.5],
  ["joined", 0.3],
  ["committed", 0.2],
];

interface FeedItem {
  id: number;
  name: string;
  action: string;
  color: string;
  icon: string;
  kgDelta: number;
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

function generateFeedItem(lastPseudonym: string, id: number): FeedItem {
  let name: string;
  do {
    name = PSEUDONYMS[Math.floor(Math.random() * PSEUDONYMS.length)];
  } while (name === lastPseudonym);

  const actionType = pickWeighted();

  switch (actionType) {
    case "burned": {
      const kg = Math.round((Math.random() * 7.5 + 0.5) * 10) / 10;
      return { id, name, action: `burned ${kg} kg fat`, color: "banner--orange", icon: "check", kgDelta: kg };
    }
    case "joined":
      return { id, name, action: "joined the crew", color: "banner--green", icon: "user-plus", kgDelta: 0 };
    case "committed": {
      const kg = Math.floor(Math.random() * 14) + 2;
      return { id, name, action: `committed to burn ${kg} kg`, color: "banner--yellow", icon: "bolt", kgDelta: 0 };
    }
  }
}

// --- Constants ---

const VISIBLE_COUNT = 3;
const ITEM_HEIGHT = 80; // 72px item + 8px gap
const MIN_INTERVAL = 1200;
const MAX_INTERVAL = 2500;
const ANIM_DURATION = 500;

// Deterministic initial items (avoids SSR hydration mismatch)
const INITIAL_ITEMS: FeedItem[] = [
  { id: 0, name: "anon.base.eth", action: "joined the crew", color: "banner--green", icon: "user-plus", kgDelta: 0 },
  { id: 1, name: "nickv.base.eth", action: "burned 5 kg fat", color: "banner--orange", icon: "check", kgDelta: 0 },
  { id: 2, name: "chad.base.eth", action: "committed to burn 7 kg", color: "banner--yellow", icon: "bolt", kgDelta: 0 },
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
  const [counterValue, setCounterValue] = useState(1247.3);
  const [isBumping, setIsBumping] = useState(false);
  const [items, setItems] = useState<FeedItem[]>(INITIAL_ITEMS);
  const [enterId, setEnterId] = useState<number | null>(null);

  const nextId = useRef(INITIAL_ITEMS.length);
  const lastPseudonym = useRef(INITIAL_ITEMS[0].name);
  const tickTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cleanupTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function tick() {
      const id = nextId.current++;
      const newItem = generateFeedItem(lastPseudonym.current, id);
      lastPseudonym.current = newItem.name;

      setEnterId(id);
      setItems(prev => [newItem, ...prev.slice(0, VISIBLE_COUNT)]);

      if (newItem.kgDelta > 0) {
        setCounterValue(v => v + newItem.kgDelta);
        setIsBumping(true);
        setTimeout(() => setIsBumping(false), 300);
      }

      cleanupTimeout.current = setTimeout(() => {
        setEnterId(null);
        setItems(prev => prev.slice(0, VISIBLE_COUNT));
      }, ANIM_DURATION);
    }

    function scheduleNext() {
      const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
      tickTimeout.current = setTimeout(() => {
        tick();
        scheduleNext();
      }, delay);
    }

    scheduleNext();
    return () => {
      if (tickTimeout.current) clearTimeout(tickTimeout.current);
      if (cleanupTimeout.current) clearTimeout(cleanupTimeout.current);
    };
  }, []);

  return (
    <>
      {label !== "" && <p className="counter-section__label">{label ?? "Community Progress"}</p>}
      <p className="counter-section__hook">{hook ?? "A shared total, growing over time"}</p>

      <div className="counter">
        <div className="counter__row">
          <span className={`counter__number${isBumping ? " bump" : ""}`}>
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
