"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "What is BurnFat.fun?",
    a: "A permanent, public ledger of fat burned by humans. Every kilogram burned gets added to a global counter that never goes down. Not a fitness app. Not a diet programme. A monument to collective effort.",
  },
  {
    q: "How does the global counter work?",
    a: "One number. It grows every time someone reports fat burned. It never resets. It represents every kilogram burned by every participant, accumulated forever. Your 2kg matters as much as someone else\u2019s 50kg. The counter doesn\u2019t rank. It just counts.",
  },
  {
    q: "How do I contribute?",
    a: "Lock your commitment. Burn the fat. Report what you burned. Your kilograms get added to the counter permanently. No deadline. No pressure. Burn at your own pace and report when you\u2019re ready.",
  },
  {
    q: "How is fat loss verified?",
    a: "V1 runs on trust. Cheating is economically pointless \u2014 you\u2019d be paying real money to add fake numbers with nothing to gain. No prizes. No leaderboard. No reason to lie. Smart scale integrations come later.",
  },
  {
    q: 'What does "lock your commitment" mean?',
    a: "You put money behind your goal \u2014 a small amount per kilogram you intend to burn. Like a gym membership, you\u2019re paying for access, not for results. When you report fat burned, the commitment unlocks to the platform. Both the fat and the money become permanent proof you took action.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq" role="list">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        const id = `faq-answer-${index}`;

        return (
          <div
            key={index}
            className={`faq__item${isOpen ? " faq__item--open" : ""}`}
            role="listitem"
          >
            <button
              className="faq__question"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              aria-controls={id}
            >
              <span>{item.q}</span>
              <span className="faq__toggle" aria-hidden="true">
                {isOpen ? "\u2212" : "+"}
              </span>
            </button>
            <div
              id={id}
              className="faq__answer-wrapper"
              role="region"
              aria-labelledby={`faq-q-${index}`}
            >
              <p className="faq__answer">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
