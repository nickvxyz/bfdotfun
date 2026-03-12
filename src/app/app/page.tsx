"use client";

import { useState, useEffect, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import Link from "next/link";
import LiveCounter from "@/components/LiveCounter";
import WaitlistForm from "@/components/WaitlistForm";
import GateModal from "@/components/GateModal";
import Header from "@/components/Header";
import Countdown from "@/components/Countdown";
import StorySection from "@/components/StorySection";
import CTAButton from "@/components/CTAButton";

type Platform = "warpcast" | "base" | "browser";
const WARPCAST_FID = 9152;
const BASE_APP_FID = 309857;

export default function MiniAppPage() {
  const [added, setAdded] = useState(false);
  const [platform, setPlatform] = useState<Platform>("browser");

  useEffect(() => {
    async function init() {
      try {
        const context = await Promise.race([
          sdk.context,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 1500)),
        ]);
        setAdded(context.client.added);
        const clientFid = context.client.clientFid;
        if (clientFid === BASE_APP_FID) setPlatform("base");
        else if (clientFid === WARPCAST_FID) setPlatform("warpcast");
      } catch {
        // Outside mini app host or timeout
      }
      sdk.actions.ready();
    }
    init();
  }, []);

  const handleAdd = useCallback(async () => {
    try {
      await sdk.actions.addMiniApp();
      setAdded(true);
    } catch {
      // User rejected or invalid manifest
    }
  }, []);

  return (
    <>
      {platform !== "base" && <GateModal />}
      <Header />

      {/* SECTION 1 — Hero */}
      <section className="hero">
        <div className="hero__content">
          <p className="hero__label">The Global Fat Burning Ledger</p>
          <h1 className="hero__title">
            Every Kilogram Matters.<br />
            Every Fat Burner Is a <span className="hero__ember">Superhero</span>.
          </h1>
          <p className="hero__subtitle">
            You fight to burn every gram, kilogram, pound of fat. Now add it to the global counter and take your place among millions of people who refused to quit. Your result deserves to be on the record.
          </p>
          <div className="cta-block">
            <p className="cta-block__question">Ready to burn?</p>
            <CTAButton>Launch Your Counter</CTAButton>
            <p className="cta-block__sub">Free. Takes 2 minutes.</p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — Counter */}
      <section className="counter-section">
        <div className="counter-section__header">
          <h2 className="counter-section__title">The Global Fat Counter</h2>
          <p className="counter-section__sub">Every number here is a real person. A real result. Permanently on the record.</p>
          <p className="counter-section__live"><span className="counter-section__live-dot" aria-hidden="true" />Burning right now</p>
        </div>
        <div className="counter-section__feed">
          <LiveCounter label="" hook="" />
        </div>
        <div className="cta-block cta-block--dark">
          <p className="cta-block__question">See yourself on this list?</p>
          <CTAButton variant="default">Add Your Kilogram</CTAButton>
        </div>
      </section>

      {/* SECTION 3 — How It Works */}
      <section className="how-it-works">
        <p className="how-it-works__label">How It Works</p>
        <h2 className="how-it-works__title">Three steps. That&apos;s it.</h2>
        <div className="how-it-works__steps">
          <div className="how-it-works__step">
            <span className="how-it-works__number">01</span>
            <p className="how-it-works__step-title">Create your counter</p>
            <p className="how-it-works__step-desc">
              Connect your wallet. Set your starting weight and goal. Your personal counter is live in under two minutes.
            </p>
          </div>
          <div className="how-it-works__step">
            <span className="how-it-works__number">02</span>
            <p className="how-it-works__step-title">Log what you burn</p>
            <p className="how-it-works__step-desc">
              Step on the scale. Enter your weight. The app calculates your fat burned automatically — every gram counts.
            </p>
          </div>
          <div className="how-it-works__step">
            <span className="how-it-works__number">03</span>
            <p className="how-it-works__step-title">Submit to the ledger</p>
            <p className="how-it-works__step-desc">
              Your burned fat gets recorded on-chain — permanently, publicly, forever. It joins the global counter. No one can take it away.
            </p>
          </div>
        </div>
        <div className="cta-block">
          <p className="cta-block__question">Ready to submit to the ledger?</p>
          <CTAButton>Start Your Counter</CTAButton>
        </div>
      </section>

      {/* SECTION 4 — The Story */}
      <StorySection />

      {/* SECTION 5 — The Uncomfortable Truth */}
      <section className="truth">
        <p className="truth__text">
          You burned the fat. But without a record, it&apos;s like it never happened.
        </p>
        <CTAButton variant="default" className="truth__cta">Claim Your Place</CTAButton>
      </section>

      {/* SECTION 6 — Countdown + Subscribe */}
      <section className="launch-section">
        <Countdown />
        <div id="waitlist" className="launch-section__waitlist">
          <p className="launch-section__waitlist-label">Stay in the loop</p>
          <WaitlistForm />
        </div>
        <p className="launch-section__launching">Launching shortly.</p>
      </section>

      {/* Miniapp-specific: Add to Collection */}
      {platform !== "browser" && !added && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <button className="cta cta--inverted" onClick={handleAdd}>
            Add to Collection
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      )}
      {added && (
        <p style={{ textAlign: "center", padding: "16px 0", opacity: 0.6, fontSize: "12px" }}>Added to your collection</p>
      )}

      {/* Footer */}
      <footer className="footer-main">
        <div className="footer-main__grid">
          <div>
            <p className="footer-main__brand-name">BurnFat.fun</p>
            <p className="footer-main__brand-desc">
              The global burned fat ledger. Every kilogram recorded on-chain, permanently, for everyone who did the hard thing.
            </p>
          </div>
          <div>
            <p className="footer-main__col-title">Product</p>
            <ul className="footer-main__links">
              <li><a href="#" className="footer-main__link">Launch Counter</a></li>
              <li><Link href="/coaches" className="footer-main__link">Coaches</Link></li>
              <li><Link href="/challenges" className="footer-main__link">Challenges</Link></li>
              <li><a href="/privacy" className="footer-main__link">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <p className="footer-main__col-title">Connect</p>
            <ul className="footer-main__links">
              <li><a href="https://x.com/burnfatdotfun" target="_blank" rel="noopener noreferrer" className="footer-main__link">X / Twitter</a></li>
              <li><a href="https://t.me/basefatburning/1" target="_blank" rel="noopener noreferrer" className="footer-main__link">Telegram</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-main__bottom">
          <p className="footer-main__copy">&copy; 2026 BurnFat.fun — All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
