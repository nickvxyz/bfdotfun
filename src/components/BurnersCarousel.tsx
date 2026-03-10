"use client";

import { useEffect, useRef, useCallback } from "react";
import CTAButton from "@/components/CTAButton";

const BURNERS = [
  { goal: "burn 15kg", quote: "Tired of doing this alone." },
  { goal: "burn 8kg", quote: "Wanted it on the record." },
  { goal: "burn 22kg", quote: "Accountability changes everything." },
  { goal: "burn 10kg", quote: "If it\u2019s not recorded, did it even happen?" },
];

const AUTO_INTERVAL = 4000;

export default function BurnersCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const scrollTo = useCallback((idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[idx] as HTMLElement | undefined;
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
    indexRef.current = idx;
  }, []);

  const advance = useCallback(() => {
    const next = (indexRef.current + 1) % BURNERS.length;
    scrollTo(next);
  }, [scrollTo]);

  useEffect(() => {
    timerRef.current = setInterval(advance, AUTO_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [advance]);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(advance, AUTO_INTERVAL);
  }, [advance]);

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const scrollLeft = track.scrollLeft;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < track.children.length; i++) {
      const child = track.children[i] as HTMLElement;
      const dist = Math.abs(child.offsetLeft - scrollLeft);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    indexRef.current = closest;
  }, []);

  return (
    <section className="burners">
      <p className="burners__label">Early Burners</p>
      <h2 className="burners__title">They&apos;re already here.</h2>
      <p className="burners__sub">
        Real people who joined BurnFat.fun to put their fat loss on the record.
      </p>

      <div
        className="burners__track"
        ref={trackRef}
        onScroll={handleScroll}
        onTouchStart={resetTimer}
        onMouseDown={resetTimer}
      >
        {BURNERS.map((b, i) => (
          <div key={i} className="burners__card">
            <p className="burners__goal">Goal: {b.goal}</p>
            <p className="burners__quote">&ldquo;{b.quote}&rdquo;</p>
          </div>
        ))}
      </div>

      <div className="burners__dots">
        {BURNERS.map((_, i) => (
          <button
            key={i}
            className="burners__dot"
            aria-label={`Go to card ${i + 1}`}
            onClick={() => { scrollTo(i); resetTimer(); }}
          />
        ))}
      </div>

      <div className="cta-block">
        <p className="cta-block__question">Ready to join them?</p>
        <CTAButton>Become a Burner</CTAButton>
      </div>
    </section>
  );
}
