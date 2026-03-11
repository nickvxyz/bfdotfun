import Header from "@/components/Header";
import CTAButton from "@/components/CTAButton";

export default function ChallengesPage() {
  return (
    <>
      <Header />
      <main className="coming-soon">
        <div className="coming-soon__icon" aria-hidden="true">&#9876;</div>
        <h1 className="coming-soon__title">Challenges</h1>
        <p className="coming-soon__subtitle">Coming Soon</p>
        <p className="coming-soon__desc">
          Compete with other fat burners. Set goals, track progress,
          win prizes. Every hero needs a worthy challenge.
        </p>
        <div className="coming-soon__divider" aria-hidden="true" />
        <div className="cta-block">
          <p className="cta-block__question">Want to compete?</p>
          <CTAButton>Join the Waitlist</CTAButton>
        </div>
      </main>
    </>
  );
}
