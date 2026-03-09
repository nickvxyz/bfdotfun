"use client";

import { useState, useEffect } from "react";

// March 12, 2026 15:00 CET (UTC+1) = 14:00 UTC
const EVENT_DATE = new Date("2026-03-12T14:00:00Z");

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function Countdown() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    const raf = requestAnimationFrame(() => setNow(new Date()));
    return () => { clearInterval(id); cancelAnimationFrame(raf); };
  }, []);

  if (!now) {
    return (
      <div className="countdown">
        <p className="countdown__title">Genesis Fat Burning Event</p>
        <p className="countdown__timer">
          <span className="countdown__segment">--<span className="countdown__unit">d</span></span>
          <span className="countdown__sep">:</span>
          <span className="countdown__segment">--<span className="countdown__unit">h</span></span>
          <span className="countdown__sep">:</span>
          <span className="countdown__segment">--<span className="countdown__unit">m</span></span>
          <span className="countdown__sep">:</span>
          <span className="countdown__segment">--<span className="countdown__unit">s</span></span>
        </p>
      </div>
    );
  }

  const diff = Math.max(0, EVENT_DATE.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const isLive = diff === 0;

  return (
    <div className="countdown">
      <p className="countdown__title">Genesis Fat Burning Event</p>
      {isLive ? (
        <p className="countdown__live">LIVE NOW</p>
      ) : (
        <p className="countdown__timer">
          <span className="countdown__segment">{pad(days)}<span className="countdown__unit">d</span></span>
          <span className="countdown__sep">:</span>
          <span className="countdown__segment">{pad(hours)}<span className="countdown__unit">h</span></span>
          <span className="countdown__sep">:</span>
          <span className="countdown__segment">{pad(minutes)}<span className="countdown__unit">m</span></span>
          <span className="countdown__sep">:</span>
          <span className="countdown__segment">{pad(seconds)}<span className="countdown__unit">s</span></span>
        </p>
      )}
      <p className="countdown__date">March 12, 2026 — 15:00 CET</p>
    </div>
  );
}
