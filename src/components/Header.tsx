"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { useAuth } from "@/lib/auth";

function BurgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, beginSignIn, signIn, cancelSignIn } = useAuth();
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();

  const isSigningIn = loading && !user;

  const handleSignIn = useCallback(async () => {
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
  }, [beginSignIn, cancelSignIn, signIn, isConnected, address, connectors, connect, router]);

  const handleProfileClick = useCallback(() => {
    setMenuOpen(false);
    router.push("/profile");
  }, [router]);

  const displayLabel = user?.display_name || (user?.wallet_address ? truncateAddress(user.wallet_address) : "Profile");

  return (
    <>
      <header className="header">
        <Link href="/" className="header__logo">BurnFat.fun</Link>

        <nav className="header__nav">
          <Link href="/feed" className="header__link">Live Feed</Link>
          <Link href="/coaches" className="header__link">Coaches</Link>
          <Link href="/challenges" className="header__link">Challenges</Link>
          {user && <Link href="/profile" className="header__link">Profile</Link>}
        </nav>

        <div className="header__right">
          <div className="header__signin">
            {user ? (
              <button
                className="header__signin-btn"
                onClick={handleProfileClick}
                aria-label="Go to profile"
              >
                {displayLabel}
              </button>
            ) : isSigningIn ? (
              <button
                className="header__signin-btn header__signin-btn--disabled"
                disabled
                aria-busy="true"
                aria-label="Signing in"
              >
                Signing in...
              </button>
            ) : (
              <button
                className="header__signin-btn"
                onClick={handleSignIn}
                aria-label="Sign in with wallet"
              >
                Sign In
              </button>
            )}
          </div>

          <button
            className="header__burger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <CloseIcon /> : <BurgerIcon />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="header__overlay">
          <div className="header__overlay-card">
            <nav className="header__overlay-nav">
              <Link href="/feed" className="header__overlay-link" onClick={() => setMenuOpen(false)}>Live Feed</Link>
              <Link href="/coaches" className="header__overlay-link" onClick={() => setMenuOpen(false)}>Coaches</Link>
              <Link href="/challenges" className="header__overlay-link" onClick={() => setMenuOpen(false)}>Challenges</Link>
              {user && (
                <Link href="/profile" className="header__overlay-link" onClick={() => setMenuOpen(false)}>Profile</Link>
              )}
              {user ? (
                <button
                  className="header__overlay-link header__overlay-link--signin"
                  onClick={handleProfileClick}
                  aria-label="Go to profile"
                >
                  {displayLabel}
                </button>
              ) : isSigningIn ? (
                <button
                  className="header__overlay-link header__overlay-link--signin"
                  disabled
                  aria-busy="true"
                  aria-label="Signing in"
                >
                  Signing in...
                </button>
              ) : (
                <button
                  className="header__overlay-link header__overlay-link--signin"
                  onClick={() => { setMenuOpen(false); handleSignIn(); }}
                  aria-label="Sign in with wallet"
                >
                  Sign In
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
