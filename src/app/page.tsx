import WaitlistForm from "@/components/WaitlistForm";
import GateModal from "@/components/GateModal";
import Header from "@/components/Header";
import DualCounter from "@/components/DualCounter";
import HomeFlow from "@/components/HomeFlow";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <GateModal />
      <Header />

      {/* SECTION 1 — The Global Reality */}
      <section className="reality">
        <div className="reality__content">
          <p className="reality__label">THE WEIGHT THE WORLD CARRIES</p>
          <h1 className="reality__title">
            The World Is Carrying 30 Billion Kilograms of Excess Fat.
          </h1>
          <p className="reality__sub">
            That number includes you, your family, your coworkers. Every kilogram burned gets recorded here — permanently.
          </p>
          <DualCounter />
        </div>
      </section>

      {/* SECTION 2+3 — BMI Calculator → Conditional CTA */}
      <HomeFlow />

      {/* SECTION 4 — Email signup */}
      <section className="launch-section">
        <div id="waitlist" className="launch-section__waitlist">
          <p className="launch-section__waitlist-label">Not ready yet? Get updates.</p>
          <WaitlistForm />
        </div>
      </section>

      <Footer />
    </>
  );
}
