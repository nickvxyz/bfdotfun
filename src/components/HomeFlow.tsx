"use client";

import { useState } from "react";
import CTAButton from "@/components/CTAButton";
import BmiCalculator from "@/components/BmiCalculator";

export default function HomeFlow() {
  const [bmiDone, setBmiDone] = useState(false);

  return (
    <>
      {/* SECTION 2 — The Personal */}
      <section className="personal">
        <div className="personal__content">
          <p className="personal__label">YOUR NUMBER</p>
          <h2 className="personal__title">What&apos;s Your BMI?</h2>
          <p className="personal__sub">
            Takes 5 seconds. We&apos;ll show you exactly how many kilograms stand between you and a healthy weight.
          </p>
          <BmiCalculator onComplete={() => setBmiDone(true)} />
        </div>
      </section>

      {/* SECTION 3 — The Call to Action — reveals after BMI */}
      {bmiDone && (
        <section className="home-cta home-cta--enter">
          <div className="home-cta__content">
            <h2 className="home-cta__title">Create Your Fat-Burning Profile.</h2>
            <p className="home-cta__sub">
              Start burning it today. Every kilogram goes on the record — permanently.
            </p>
            <CTAButton>Create My Profile</CTAButton>
            <p className="home-cta__trust">Free. 2 minutes. No credit card.</p>
          </div>
        </section>
      )}
    </>
  );
}
