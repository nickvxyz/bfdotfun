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
  const { user, beginSignIn, signIn, cancelSignIn } = useAuth();
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();

  const handleClick = useCallback(async () => {
    if (user) {
      router.push("/profile");
      return;
    }

    beginSignIn();
    try {
      if (!isConnected) {
        const connector = connectors[0];
        if (!connector) return;
        connect(
          { connector },
          {
            onSuccess: (data) => {
              const connectedAddress = data.accounts[0];
              if (connectedAddress) {
                signIn(connectedAddress).then((success) => {
                  if (success) router.push("/profile");
                });
              }
            },
            onError: () => {
              cancelSignIn();
            },
          },
        );
      } else if (address) {
        const success = await signIn(address);
        if (success) router.push("/profile");
      }
    } catch {
      cancelSignIn();
    }
  }, [user, beginSignIn, cancelSignIn, signIn, isConnected, address, connectors, connect, router]);

  return (
    <button
      className={`cta${variant === "inverted" ? " cta--inverted" : ""}${className ? ` ${className}` : ""}`}
      onClick={handleClick}
      aria-label={user ? "Go to profile" : "Sign in to get started"}
    >
      <span>{children}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
  );
}
