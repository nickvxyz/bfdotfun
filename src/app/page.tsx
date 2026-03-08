import LiveCounter from "@/components/LiveCounter";
import WaitlistForm from "@/components/WaitlistForm";
import GateModal from "@/components/GateModal";
import Header from "@/components/Header";
import Countdown from "@/components/Countdown";
import StorySection from "@/components/StorySection";

export default function Home() {
  return (
    <>
      <GateModal />
      <Header />

      {/* SECTION 1 — Hero */}
      <section className="hero">
        <p className="hero__label">BurnFat.fun</p>
        <h1 className="hero__title">
          Every Kilogram Matters.<br />
          Every Fat Burner Is a Hero.
        </h1>
        <p className="hero__subtitle">
          You fight to burn every gram, kilogram, pound of fat. Now add it to the global counter and take your place among millions of people who refused to quit. Your result deserves to be on the record.
        </p>
        <a href="#" className="cta cta--inverted">
          <span>Launch Your Counter</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
        <p className="hero__trust">Free. Takes 2 minutes. Your profile, your success story, your proof.</p>
      </section>

      {/* SECTION 2 — The Global Counter + Live Burn Feed */}
      <section className="counter-section">
        <div className="counter-section__header">
          <h2 className="counter-section__title">The Global Fat Counter</h2>
          <p className="counter-section__sub">Every number here is a real person. A real result. Permanently on the record.</p>
        </div>
        <div className="counter-section__feed">
          <LiveCounter label="" hook="" />
        </div>
        <div className="counter-section__footer">
          <a href="#" className="cta">
            <span>Launch Your Counter</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
          <p className="counter-section__hook-line">Your kilogram belongs on this list.</p>
        </div>
      </section>

      {/* SECTION 3 — The Story */}
      <StorySection />

      {/* SECTION 4 — The Uncomfortable Truth */}
      <section className="truth">
        <p className="truth__text">
          You burned the fat. But without a record, it&apos;s like it never happened.
        </p>
        <a href="#" className="cta truth__cta">
          <span>Launch Your Counter</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
      </section>

      {/* SECTION 5 — Countdown + Early Access */}
      <section className="launch-section">
        <Countdown />
        <div className="launch-section__waitlist">
          <p className="launch-section__waitlist-label">Get Early Access</p>
          <WaitlistForm />
        </div>
        <p className="launch-section__launching">Launching shortly.</p>
      </section>

      <footer className="footer">
        <p className="footer__copy">&copy; 2026 BurnFat.fun</p>
      </footer>
    </>
  );
}
