import LiveCounter from "@/components/LiveCounter";
import WaitlistForm from "@/components/WaitlistForm";
import FaqAccordion from "@/components/FaqAccordion";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <p className="hero__label">Fat Burn Fun</p>
        <h1 className="hero__title">
          A Public Ledger<br />for Fat Burned
        </h1>
        <p className="hero__subtitle">
          Every kilogram burned is recorded permanently.<br />
          Individual journeys stay private. The global total remains.
        </p>
      </section>

      {/* Statement */}
      <section className="statement">
        <p className="statement__label">Vision</p>
        <p className="statement__text">
          Every kilogram burned on purpose is a remarkable milestone. Fat burn fun makes it permanent.
        </p>
      </section>

      {/* Counter Section */}
      <section className="counter-section">
        <div className="counter-section__grid">
          <div className="counter-section__left">
            <LiveCounter />
          </div>

          <div className="counter-section__right">
            <p className="counter-section__text">
              This number reflects the total amount of fat burned by participants so far. Only confirmed results are added. Nothing is reset.
            </p>
            <p className="counter-section__text" style={{ marginTop: 16 }}>
              Launching shortly.
            </p>
            <a
              href="https://t.me/basefatburning/428"
              target="_blank"
              rel="noopener noreferrer"
              className="cta cta--inverted"
            >
              Get Notified
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="waitlist-section">
        <p className="waitlist-section__label">Join Waitlist</p>
        <h2 className="waitlist-section__title">Get Early Access</h2>
        <p className="waitlist-section__subtitle">
          Leave your email. We&apos;ll notify you when the ledger opens.
        </p>
        <WaitlistForm />
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <p className="faq-section__label">How It Works</p>
        <FaqAccordion />
      </section>

      {/* Footer */}
      <footer className="footer">
        <p className="footer__copy">&copy; 2026 BurnFat.fun</p>
      </footer>
    </>
  );
}
