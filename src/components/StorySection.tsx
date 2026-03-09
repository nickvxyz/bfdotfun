"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import CTAButton from "@/components/CTAButton";

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

const VISIBLE_COUNT = 7;

export default function StorySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  const observeParagraphs = useCallback((root: HTMLElement) => {
    const paragraphs = root.querySelectorAll(".story__text:not(.story__text--observed)");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.classList.add("story__text--visible");

            if (
              el.classList.contains("story__text--accent") ||
              el.classList.contains("story__text--strong") ||
              el.classList.contains("story__text--break") ||
              el.classList.contains("story__text--punchline")
            ) {
              el.classList.add("story__text--typewriter");
              const text = el.textContent || "";
              el.textContent = "";
              el.style.opacity = "1";
              let i = 0;
              const speed = el.classList.contains("story__text--break") ? 60 : 30;
              function type() {
                if (i < text.length) {
                  el.textContent = text.slice(0, i + 1);
                  i++;
                  setTimeout(type, speed);
                } else {
                  el.classList.remove("story__text--typewriter");
                }
              }
              type();
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    paragraphs.forEach((p) => {
      p.classList.add("story__text--observed");
      observer.observe(p);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    return observeParagraphs(container);
  }, [observeParagraphs]);

  useEffect(() => {
    if (expanded && expandedRef.current) {
      return observeParagraphs(expandedRef.current);
    }
  }, [expanded, observeParagraphs]);

  const handleExpand = () => {
    setExpanded(true);
  };

  return (
    <section className="story" ref={containerRef}>
      <p className="story__label">The Story</p>
      <h2 className="story__headline">For everyone who ever burned fat.</h2>
      <h3 className="story__subheadline">You Know That Morning.</h3>

      <div className="story__content">
        {PARAGRAPHS.slice(0, VISIBLE_COUNT).map((p, i) => (
          <p key={i} className={`${p.className} story__text--visible`}>
            {p.text}
          </p>
        ))}

        {!expanded && (
          <button className="story__expand" onClick={handleExpand}>
            Read the full story &rarr;
          </button>
        )}

        {expanded && (
          <div ref={expandedRef}>
            {PARAGRAPHS.slice(VISIBLE_COUNT).map((p, i) => (
              <p key={i + VISIBLE_COUNT} className={p.className}>
                {p.text}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="cta-block">
        <p className="cta-block__question">Ready to be seen?</p>
        <CTAButton>Put Your Result on the Record</CTAButton>
      </div>
    </section>
  );
}
