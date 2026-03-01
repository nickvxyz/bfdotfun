"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export default function MiniAppRedirect() {
  useEffect(() => {
    async function check() {
      try {
        await sdk.context;
        window.location.replace("/app");
      } catch {
        // Not inside a mini app host — do nothing
      }
    }
    check();
  }, []);

  return null;
}
