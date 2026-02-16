"use client";

import { useState } from "react";

const FORMSPREE_URL = "https://formspree.io/f/mbdayrbn";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !consent) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {submitted ? (
        <p className="waitlist-section__success">You&apos;re on the list.</p>
      ) : (
        <>
          <div className="waitlist-section__form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="waitlist-section__input"
              required
            />
            <button
              type="submit"
              className="waitlist-section__button"
              disabled={!consent || submitting}
            >
              {submitting ? "Sending..." : "Get Early Access"}
            </button>
          </div>
          {error && <p className="waitlist-section__error">{error}</p>}
          <label className="waitlist-section__consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="waitlist-section__checkbox"
            />
            <span>
              I agree to receive launch updates. See our{" "}
              <a href="/privacy" className="waitlist-section__link">Privacy Policy</a>.
            </span>
          </label>
        </>
      )}
    </form>
  );
}
