"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function BurgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToWaitlist = useCallback(() => {
    setMenuOpen(false);
    const el = document.getElementById("waitlist");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/#waitlist");
    }
  }, [router]);

  return (
    <>
      <header className="header">
        <Link href="/" className="header__logo">BurnFat.fun</Link>

        <nav className="header__nav">
          <Link href="/feed" className="header__link">Live Feed</Link>
          <Link href="/coaches" className="header__link">Coaches</Link>
          <Link href="/challenges" className="header__link">Challenges</Link>
        </nav>

        <div className="header__right">
          <div className="header__signin">
            <button
              className="header__signin-btn"
              onClick={scrollToWaitlist}
            >
              Join Waitlist
            </button>
          </div>

          <button
            className="header__burger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <CloseIcon /> : <BurgerIcon />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="header__overlay">
          <div className="header__overlay-card">
            <nav className="header__overlay-nav">
              <Link href="/feed" className="header__overlay-link" onClick={() => setMenuOpen(false)}>Live Feed</Link>
              <Link href="/coaches" className="header__overlay-link" onClick={() => setMenuOpen(false)}>Coaches</Link>
              <Link href="/challenges" className="header__overlay-link" onClick={() => setMenuOpen(false)}>Challenges</Link>
              <button className="header__overlay-link header__overlay-link--signin" onClick={scrollToWaitlist}>
                Join Waitlist
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
