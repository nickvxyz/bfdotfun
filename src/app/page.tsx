import Link from "next/link";
import LiveCounter from "@/components/LiveCounter";
import WaitlistForm from "@/components/WaitlistForm";
import GateModal from "@/components/GateModal";
import Header from "@/components/Header";
import Countdown from "@/components/Countdown";
import StorySection from "@/components/StorySection";
import CTAButton from "@/components/CTAButton";

export default function Home() {
  return (
    <>
      <GateModal />
      <Header />

      {/* SECTION 1 — Hero → shapes: This place is for me */}
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">
            Every Kilogram Matters.<br />
            Every Fat Burner Is a Superhero.
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

      {/* SECTION 2 — Counter → shapes: It's real, it's alive, I want to be on it */}
      <section className="counter-section">
        <div className="counter-section__header">
          <h2 className="counter-section__title">The Global Fat Counter</h2>
          <p className="counter-section__sub">Every number here is a real person. A real result. Permanently on the record.</p>
        </div>
        <div className="counter-section__feed">
          <LiveCounter label="" hook="" />
        </div>
        <div className="cta-block cta-block--dark">
          <p className="cta-block__question">See yourself on this list?</p>
          <CTAButton variant="default">Add Your Kilogram</CTAButton>
        </div>
      </section>

      {/* SECTION 3 — How It Works → shapes: This is simple, I can do this */}
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

      {/* SECTION 4 — The Story → shapes: These people are just like me */}
      <StorySection />

      {/* SECTION 7 — The Uncomfortable Truth → shapes: I need this */}
      <section className="truth">
        <p className="truth__text">
          You burned the fat. But without a record, it&apos;s like it never happened.
        </p>
        <CTAButton variant="default" className="truth__cta">Claim Your Place</CTAButton>
      </section>

      {/* SECTION 8 — Countdown + Subscribe */}
      <section className="launch-section">
        <Countdown />
        <div id="waitlist" className="launch-section__waitlist">
          <p className="launch-section__waitlist-label">Stay in the loop</p>
          <WaitlistForm />
        </div>
        <p className="launch-section__launching">Launching shortly.</p>
      </section>

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
              <li><Link href="/challenges" className="footer-main__link">Challenges</Link></li>
              <li><a href="/privacy" className="footer-main__link">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <p className="footer-main__col-title">Built On</p>
            <ul className="footer-main__links">
              <li><a href="https://base.org" target="_blank" rel="noopener noreferrer" className="footer-main__link">Base</a></li>
              <li><a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer" className="footer-main__link">Coinbase Wallet</a></li>
            </ul>
          </div>
          <div>
            <p className="footer-main__col-title">Connect</p>
            <ul className="footer-main__links">
              <li><a href="https://x.com/burnfatdotfun" target="_blank" rel="noopener noreferrer" className="footer-main__link">X / Twitter</a></li>
              <li><a href="#" className="footer-main__link">Farcaster</a></li>
              <li><a href="https://t.me/c/basefatburning/1" target="_blank" rel="noopener noreferrer" className="footer-main__link">Telegram</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-main__bottom">
          <p className="footer-main__copy">&copy; 2026 BurnFat.fun — All rights reserved.</p>
          <div className="footer-main__socials">
            <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="footer-main__social">Built on Base</a>
          </div>
        </div>
      </footer>
    </>
  );
}
