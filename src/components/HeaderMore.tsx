"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function HeaderMore() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="header__more" ref={ref}>
      <button
        className="header__link header__more-btn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        More
        <svg
          className={`header__more-caret${open ? " header__more-caret--open" : ""}`}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <polyline points="2,3.5 5,6.5 8,3.5" />
        </svg>
      </button>
      {open && (
        <div className="header__more-dropdown">
          <Link href="/about" className="header__more-link" onClick={() => setOpen(false)}>About</Link>
        </div>
      )}
    </div>
  );
}
