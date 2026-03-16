"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { useAuth } from "@/lib/auth";

export default function CTAButton({
  children,
  variant = "inverted",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "inverted";
  className?: string;
}) {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { user, loading, beginSignIn, cancelSignIn, signIn, devMode } = useAuth();

  const handleClick = useCallback(async () => {
    // Already signed in — go to profile
    if (user) {
      router.push("/profile");
      return;
    }

    if (loading) return;

    beginSignIn();

    let connectedAddress: `0x${string}` | undefined;

    if (!devMode && !isConnected) {
      const connector = connectors[0];
      if (!connector) {
        cancelSignIn();
        return;
      }
      try {
        const result = await connectAsync({ connector });
        connectedAddress = result.accounts[0];
      } catch {
        cancelSignIn();
        return;
      }
    }

    const ok = await signIn(connectedAddress);
    if (ok) router.push("/profile");
  }, [user, loading, devMode, beginSignIn, cancelSignIn, signIn, connectors, connectAsync, router, isConnected]);

  return (
    <button
      className={`cta${variant === "inverted" ? " cta--inverted" : ""}${className ? ` ${className}` : ""}`}
      onClick={handleClick}
    >
      <span>{children}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
  );
}
