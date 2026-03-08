"use client";

import { useEffect, useRef } from "react";

const PARAGRAPHS = [
  {
    text: "Maybe it was a photo. Maybe it was the mirror. Maybe it was just a quiet moment where you looked at yourself and thought\u2009\u2014\u2009okay, time to change.",
    className: "story__text",
  },
  {
    text: "No drama. No breakdown. Just a decision.",
    className: "story__text story__text--accent",
  },
  {
    text: "So you started. You changed what you ate. You moved more. You said no to things you used to say yes to. Some weeks were good. Some weeks you fell off and climbed back on. Over and over.",
    className: "story__text",
  },
  {
    text: "And then\u2009\u2014\u2009kilogram by kilogram\u2009\u2014\u2009it happened.",
    className: "story__text story__text--accent",
  },
  {
    text: "You lost 5. Then 10. Then maybe 20. Your body changed. Your energy changed. The way you walked into a room changed.",
    className: "story__text",
  },
  {
    text: "You did something genuinely hard. Something most people talk about and never actually do.",
    className: "story__text story__text--strong",
  },
  {
    text: "And then\u2026 nothing.",
    className: "story__text story__text--break",
  },
  {
    text: "Nobody really noticed. Or if they did\u2009\u2014\u2009it was one comment, one moment, and then life moved on. Your achievement just sat there, unrecorded, unseen. Like it never happened.",
    className: "story__text",
  },
  {
    text: "That never felt right.",
    className: "story__text story__text--accent",
  },
  {
    text: "Because here\u2019s the truth\u2009\u2014\u2009you\u2019re not alone in this.",
    className: "story__text story__text--strong",
  },
  {
    text: "Right now, thousands of people around the world are on the same journey. Same early mornings. Same discipline. Same quiet pride when the number finally moves. They\u2019re in different countries, speaking different languages, following different methods\u2009\u2014\u2009but they\u2019re fighting the same fight.",
    className: "story__text",
  },
  {
    text: "And every single one of them deserves to be seen.",
    className: "story__text story__text--accent",
  },
  {
    text: "BurnFat.fun is simple. You record what you burned. It gets added to the global counter\u2009\u2014\u2009permanently, publicly, forever. Your 20\u2009kg sits next to someone\u2019s 3\u2009kg and someone else\u2019s 47\u2009kg. Together it becomes something bigger than any one person\u2019s journey.",
    className: "story__text",
  },
  {
    text: "A monument to everyone who did the hard thing.",
    className: "story__text story__text--punchline",
  },
  {
    text: "Your result belongs on it.",
    className: "story__text story__text--accent",
  },
];

export default function StorySection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const paragraphs = container.querySelectorAll(".story__text");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("story__text--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    paragraphs.forEach((p) => observer.observe(p));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="story" ref={containerRef}>
      <p className="story__label">The Story</p>
      <h2 className="story__headline">For everyone who ever burned fat.</h2>
      <h3 className="story__subheadline">You Know That Morning.</h3>

      <div className="story__content">
        {PARAGRAPHS.map((p, i) => (
          <p key={i} className={p.className}>
            {p.text}
          </p>
        ))}
      </div>

      <a href="#" className="cta cta--inverted story__cta">
        <span>Launch Your Counter</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </a>
    </section>
  );
}
