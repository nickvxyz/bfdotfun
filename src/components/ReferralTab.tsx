"use client";

import { useState, useEffect, useCallback } from "react";

interface ReferralData {
  code: string;
  link: string;
  referral_count: number;
  total_earned: string;
}

export function ReferralTab() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchReferral = useCallback(async () => {
    try {
      const res = await fetch("/api/referrals");
      if (!res.ok) {
        if (res.status === 401) {
          setLoading(false);
          return;
        }
        const body = await res.json();
        throw new Error(body.error || "Failed to load referral data");
      }
      const body = await res.json();
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load referral data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferral();
  }, [fetchReferral]);

  const handleCopy = useCallback(async () => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = data.link;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [data?.link]);

  if (loading) {
    return (
      <div className="referral-tab">
        <p className="referral-tab__loading">Loading referral data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="referral-tab">
        <p className="referral-tab__error">{error}</p>
        <button
          className="referral-tab__retry-btn"
          onClick={() => { setError(null); setLoading(true); fetchReferral(); }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="referral-tab">
        <p className="referral-tab__empty">Sign in to get your referral link.</p>
      </div>
    );
  }

  return (
    <div className="referral-tab">
      <section className="referral-tab__section">
        <h3 className="referral-tab__section-title">Your Referral Link</h3>
        <div className="referral-tab__link-box">
          <span className="referral-tab__link-text">{data.link}</span>
          <button
            className="referral-tab__copy-btn"
            onClick={handleCopy}
            aria-label="Copy referral link"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="referral-tab__code">
          Code: <span className="referral-tab__code-value">{data.code}</span>
        </p>
      </section>

      <section className="referral-tab__section">
        <h3 className="referral-tab__section-title">Stats</h3>
        <div className="referral-tab__stats">
          <div className="referral-tab__stat">
            <span className="referral-tab__stat-value">{data.referral_count}</span>
            <span className="referral-tab__stat-label">referrals</span>
          </div>
          <div className="referral-tab__stat">
            <span className="referral-tab__stat-value referral-tab__stat-value--earned">
              ${data.total_earned}
            </span>
            <span className="referral-tab__stat-label">USDC earned</span>
          </div>
        </div>
      </section>

      <p className="referral-tab__info">
        Earn 1/3 of every submission fee when someone signs up with your link.
      </p>
    </div>
  );
}
