"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const ACTIVITY_FEED = [
  { name: "anon.base.eth", action: "joined the crew", color: "banner--green", icon: "user-plus", kgDelta: 0 },
  { name: "nickv.base.eth", action: "burned 5 kg fat", color: "banner--orange", icon: "check", kgDelta: 5 },
  { name: "chad.base.eth", action: "committed to burn 7 kg", color: "banner--yellow", icon: "bolt", kgDelta: 0 },
] as const;

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
  return num.toLocaleString("en-US");
}

export default function LiveCounter({ hook }: { hook?: string }) {
  const [counterValue, setCounterValue] = useState(1247);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isBumping, setIsBumping] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const bannerIndex = useRef(0);

  const rotateBanner = useCallback(() => {
    const next = (bannerIndex.current + 1) % ACTIVITY_FEED.length;
    bannerIndex.current = next;
    const item = ACTIVITY_FEED[next];

    setCurrentBanner(next);
    setIsShaking(true);

    if (item.kgDelta > 0) {
      setCounterValue((v) => v + item.kgDelta);
      setIsBumping(true);
    }

    setTimeout(() => {
      setIsShaking(false);
      setIsBumping(false);
    }, 300);
  }, []);

  useEffect(() => {
    const interval = setInterval(rotateBanner, 4000);
    return () => clearInterval(interval);
  }, [rotateBanner]);

  return (
    <>
      <p className="counter-section__label">Community Progress</p>
      <p className="counter-section__hook">{hook ?? "A shared total, growing over time"}</p>

      <div className="counter">
        <div className="counter__row">
          <span className={`counter__number${isBumping ? " bump" : ""}`}>
            {formatNumber(counterValue)}
          </span>
          <span className="counter__unit">KG</span>
        </div>
        <span className="counter__label">fat burned together</span>
      </div>

      <div className="banners" aria-live="polite">
        <p className="banners__label">Live Activity</p>
        <div className="banners__container">
          {ACTIVITY_FEED.map((item, index) => (
            <div
              key={index}
              className={`banner ${item.color}${
                index === currentBanner ? " active" : ""
              }${index === currentBanner && isShaking ? " shake" : ""}`}
              aria-hidden={index !== currentBanner}
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
        </div>
      </div>
    </>
  );
}
