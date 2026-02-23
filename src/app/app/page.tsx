"use client";

import { useState, useEffect, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import LiveCounter from "@/components/LiveCounter";

export default function MiniAppPage() {
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const context = await sdk.context;
        setAdded(context.client.added);
      } catch {
        // Outside Warpcast — show page anyway
      }
      sdk.actions.ready();
      setLoading(false);
    }
    init();
  }, []);

  const handleAdd = useCallback(async () => {
    try {
      await sdk.actions.addMiniApp();
      setAdded(true);
    } catch {
      // User rejected or invalid manifest
    }
  }, []);

  if (loading) return null;

  return (
    <div className="miniapp">
      <div className="miniapp__header">
        <h1 className="miniapp__title">BurnFat.fun</h1>
        <p className="miniapp__subtitle">
          A public ledger for fat burned by humans.
          Every kilogram burned is recorded permanently.
        </p>
      </div>

      <div className="miniapp__counter">
        <LiveCounter label="" hook="Every kg burned is recorded permanently." />
      </div>

      <div className="miniapp__footer">
        {added ? (
          <p className="miniapp__added">Added to your collection</p>
        ) : (
          <button className="cta cta--inverted" onClick={handleAdd}>
            Add to Collection
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
        <p className="miniapp__launching">Launching shortly.</p>
      </div>
    </div>
  );
}
