"use client";

import { useState, useCallback, useEffect, useSyncExternalStore } from "react";

function getGateVisible() {
  try {
    return !localStorage.getItem("gate_dismissed");
  } catch {
    return true;
  }
}

function subscribeGate(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export default function GateModal() {
  const shouldShow = useSyncExternalStore(subscribeGate, getGateVisible, () => false);
  const [dismissed, setDismissed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const visible = shouldShow && !dismissed;

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [visible]);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      try { localStorage.setItem("gate_dismissed", "true"); } catch { /* no-op */ }
      document.body.style.overflow = "";
      setDismissed(true);
    }, 300);
  }, []);

  if (!visible) return null;

  return (
    <div className={`gate ${exiting ? "gate--exit" : ""}`}>
      <div className="gate__card">
        <h2 className="gate__title">How it works</h2>

        <p className="gate__desc">
          BurnFat.fun allows <span className="gate__highlight">anyone</span> to
          create a personal counter and add their contribution to the global fat
          burn total. All data submitted to the Global Burned Fat Ledger is
          recorded on-chain — <span className="gate__highlight">permanently</span>.
        </p>

        <div className="gate__steps">
          <p className="gate__step">
            <strong>Step 1:</strong> create your account
          </p>
          <p className="gate__step">
            <strong>Step 2:</strong> burn fat
          </p>
          <p className="gate__step">
            <strong>Step 3:</strong> submit your burns to the Global Burned Fat Ledger
          </p>
        </div>

        <p className="gate__terms">
          By clicking this button, you agree to the terms and conditions and
          certify that you are over 18 years old.
        </p>

        <button className="gate__cta" onClick={handleDismiss}>
          I&apos;m ready to burn 🔥
        </button>

        <p className="gate__links">
          <a href="/privacy" target="_blank" rel="noopener noreferrer">
            Privacy policy
          </a>
          {" | "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">
            Terms &amp; conditions
          </a>
        </p>
      </div>
    </div>
  );
}
