"use client";

import { useState, useEffect, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import LiveCounter from "@/components/LiveCounter";
import WaitlistForm from "@/components/WaitlistForm";
import GateModal from "@/components/GateModal";


type Platform = "warpcast" | "base" | "browser";
const WARPCAST_FID = 9152;
const BASE_APP_FID = 309857;

export default function MiniAppPage() {
  const [added, setAdded] = useState(false);
  const [platform, setPlatform] = useState<Platform>("browser");

  useEffect(() => {
    async function init() {
      try {
        const context = await Promise.race([
          sdk.context,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 1500)),
        ]);
        setAdded(context.client.added);
        const clientFid = context.client.clientFid;
        if (clientFid === BASE_APP_FID) setPlatform("base");
        else if (clientFid === WARPCAST_FID) setPlatform("warpcast");
      } catch {
        // Outside mini app host or timeout
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

  return (
    <>
    {platform !== "base" && <GateModal />}
    <div className="miniapp">
      <div className="miniapp__header">
        <h1 className="miniapp__title">BurnFat.fun</h1>
        <p className="miniapp__subtitle">A Public Ledger for Fat Burned</p>
      </div>

      <div className="miniapp__counter">
        <LiveCounter label="" hook="You fight to burn every gram, kilogram, pound of fat. The Fat Burn Ledger records it permanently." />
      </div>

      <div className="miniapp__cards">
        <p className="miniapp__cards-label">Who It&apos;s For</p>
        <div className="miniapp__cards-grid">
          <div className="miniapp__card">
            <h3 className="miniapp__card-title">Individuals</h3>
            <p className="miniapp__card-desc">Join the global counter. Submit your fat loss, see it added to humanity&apos;s total. Just a number that grows.</p>
          </div>
          <div className="miniapp__card">
            <h3 className="miniapp__card-title">Coaches</h3>
            <p className="miniapp__card-desc">Create your counter. Add clients. They submit body data, you get verifiable proof of results. No spreadsheets. No trust issues.</p>
          </div>
          <div className="miniapp__card">
            <h3 className="miniapp__card-title">Gyms</h3>
            <p className="miniapp__card-desc">Create a gym-wide counter. Members&apos; progress aggregates into one number. Social proof that sells memberships — backed by permanent data.</p>
          </div>
          <div className="miniapp__card">
            <h3 className="miniapp__card-title">Companies</h3>
            <p className="miniapp__card-desc">Create a company counter. Employees submit weigh-ins, run wellness challenges with prize pools. All results recorded permanently.</p>
          </div>
        </div>
      </div>

      <div className="miniapp__waitlist">
        <p className="miniapp__waitlist-label">Get Early Access</p>
        <WaitlistForm />
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
    </>
  );
}
