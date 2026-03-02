"use client";

import { useAccount, useConnect } from "wagmi";
import { useAuth } from "@/lib/auth";

export default function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <button className="connect-wallet connect-wallet--loading" disabled>...</button>;
  }

  // Connected + authenticated
  if (isConnected && user) {
    const short = `${address?.slice(0, 6)}...${address?.slice(-4)}`;
    return (
      <div className="connect-wallet connect-wallet--connected">
        <span className="connect-wallet__address">{user.display_name || short}</span>
        <button className="connect-wallet__disconnect" onClick={signOut}>
          Disconnect
        </button>
      </div>
    );
  }

  // Wallet connected but not authenticated
  if (isConnected && !user) {
    return (
      <button className="connect-wallet connect-wallet--sign" onClick={signIn}>
        Sign In
      </button>
    );
  }

  // Not connected
  return (
    <button
      className="connect-wallet"
      onClick={() => {
        const connector = connectors[0];
        if (connector) connect({ connector });
      }}
    >
      Connect Wallet
    </button>
  );
}
