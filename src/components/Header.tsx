"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { useAuth } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

function BaseLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 1280 1280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,101.12c0-34.64,0-51.95,6.53-65.28,6.25-12.76,16.56-23.07,29.32-29.32C49.17,0,66.48,0,101.12,0h1077.76c34.63,0,51.96,0,65.28,6.53,12.75,6.25,23.06,16.56,29.32,29.32,6.52,13.32,6.52,30.64,6.52,65.28v1077.76c0,34.63,0,51.96-6.52,65.28-6.26,12.75-16.57,23.06-29.32,29.32-13.32,6.52-30.65,6.52-65.28,6.52H101.12c-34.64,0-51.95,0-65.28-6.52-12.76-6.26-23.07-16.57-29.32-29.32-6.53-13.32-6.53-30.65-6.53-65.28V101.12Z" fill="#0052FF"/>
    </svg>
  );
}

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

export default function Header() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { user, beginSignIn, cancelSignIn, signIn, signOut, devMode } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthed = !!user;
  const short = user?.wallet_address
    ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`
    : "";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const handleSignIn = useCallback(async () => {
    setDropdownOpen(false);
    setMenuOpen(false);

    // Set guard BEFORE connectAsync to prevent useEffect race
    beginSignIn();

    let connectedAddress: `0x${string}` | undefined;

    // Connect wallet if not already connected
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
        return; // User rejected connection
      }
    }

    // Sign message — pass address from connectAsync to avoid stale hook value
    const ok = await signIn(connectedAddress);
    if (ok) router.push("/profile");
  }, [devMode, beginSignIn, cancelSignIn, signIn, connectors, connectAsync, router, isConnected]);

  const handleSignOut = useCallback(() => {
    setDropdownOpen(false);
    setMenuOpen(false);
    signOut();
  }, [signOut]);

  return (
    <>
      <header className="header">
        <Link href="/" className="header__logo">BurnFat.fun</Link>

        <nav className="header__nav">
          <Link href="/feed" className="header__link">Live Feed</Link>
          <Link href="/coaches" className="header__link">Coaches</Link>
          <Link href="/companies" className="header__link">Companies</Link>
        </nav>

        <div className="header__right">
          <ThemeToggle />

          {isAuthed ? (
            <div className="header__user" ref={dropdownRef}>
              <button
                className="header__user-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
              >
                <BaseLogo />
                <span className="header__user-name">{user?.display_name || short}</span>
              </button>
              {dropdownOpen && (
                <div className="header__dropdown">
                  <Link href="/profile" className="header__dropdown-item" onClick={() => setDropdownOpen(false)}>Profile</Link>
                  <button className="header__dropdown-item header__dropdown-item--danger" onClick={handleSignOut}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="header__signin" ref={dropdownRef}>
              <button
                className="header__signin-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
              >
                Sign In
              </button>
              {dropdownOpen && (
                <div className="header__dropdown">
                  <button className="header__dropdown-item header__dropdown-item--base" onClick={handleSignIn}>
                    <BaseLogo />
                    Sign in with Base
                  </button>
                </div>
              )}
            </div>
          )}

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
        <div className="header__mobile-menu">
          <Link href="/feed" className="header__mobile-link" onClick={() => setMenuOpen(false)}>Live Feed</Link>
          <Link href="/coaches" className="header__mobile-link" onClick={() => setMenuOpen(false)}>Coaches</Link>
          <Link href="/companies" className="header__mobile-link" onClick={() => setMenuOpen(false)}>Companies</Link>
          {isAuthed ? (
            <>
              <Link href="/profile" className="header__mobile-link" onClick={() => setMenuOpen(false)}>Profile</Link>
              <button className="header__mobile-link header__mobile-link--danger" onClick={handleSignOut}>Sign Out</button>
            </>
          ) : (
            <button className="header__mobile-signin" onClick={handleSignIn}>
              <BaseLogo />
              Sign in with Base
            </button>
          )}
        </div>
      )}
    </>
  );
}
