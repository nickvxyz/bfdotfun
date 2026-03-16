import type { Metadata } from "next";
import LiveCounter from "@/components/LiveCounter";
import WaitlistForm from "@/components/WaitlistForm";
import Header from "@/components/Header";
import StorySection from "@/components/StorySection";
import CTAButton from "@/components/CTAButton";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About — BurnFat.fun",
  description: "The story behind BurnFat.fun — the global burned fat ledger.",
};

export default function AboutPage() {
  return (
    <>
      <Header />

      {/* Hero */}
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
        </div>
      </section>

      {/* Counter + Feed */}
      <section className="counter-section">
        <div className="counter-section__header">
          <h2 className="counter-section__title">The Global Fat Counter</h2>
          <p className="counter-section__sub">Every number here is a real person. A real result. Permanently on the record.</p>
          <p className="counter-section__live"><span className="counter-section__live-dot" aria-hidden="true" />Burning right now</p>
        </div>
        <div className="counter-section__feed">
          <LiveCounter label="" hook="" />
        </div>
      </section>

      {/* How It Works */}
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
      </section>

      {/* Story */}
      <StorySection showCta={false} />

      {/* Truth */}
      <section className="truth">
        <p className="truth__text">
          You burned the fat. But without a record, it&apos;s like it never happened.
        </p>
      </section>

      {/* Email signup */}
      <section className="launch-section">
        <div id="waitlist" className="launch-section__waitlist">
          <p className="launch-section__waitlist-label">Stay in the loop</p>
          <WaitlistForm />
        </div>
      </section>

      {/* Final CTA */}
      <section className="about-cta">
        <CTAButton>Start Your Journey</CTAButton>
      </section>

      <Footer />
    </>
  );
}
