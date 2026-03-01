"use client";

import { useState, useEffect, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import LiveCounter from "@/components/LiveCounter";

type Platform = "warpcast" | "base" | "browser";
const WARPCAST_FID = 9152;
const BASE_APP_FID = 309857;

export default function MiniAppHost() {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [added, setAdded] = useState(false);
  const [platform, setPlatform] = useState<Platform>("browser");

  useEffect(() => {
    async function init() {
      try {
        const context = await sdk.context;
        setAdded(context.client.added);
        const clientFid = context.client.clientFid;
        if (clientFid === BASE_APP_FID) setPlatform("base");
        else if (clientFid === WARPCAST_FID) setPlatform("warpcast");
        setIsMiniApp(true);
      } catch {
        // Not inside a mini app host — render nothing
      }
      sdk.actions.ready();
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

  if (!isMiniApp) return null;

  return (
    <div className="miniapp miniapp--overlay">
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
        {platform !== "browser" && !added && (
          <button className="cta cta--inverted" onClick={handleAdd}>
            Add to Collection
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
        {added && (
          <p className="miniapp__added">Added to your collection</p>
        )}
        <p className="miniapp__launching">Launching shortly.</p>
      </div>
    </div>
  );
}
