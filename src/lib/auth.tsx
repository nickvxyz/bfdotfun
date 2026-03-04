"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { IS_DEV_MODE, DEV_USER } from "@/lib/dev";

export interface User {
  id: string;
  wallet_address: string;
  display_name: string | null;
  role: "individual" | "coach" | "gym" | "company";
  starting_weight: number | null;
  goal_weight: number | null;
  height_cm: number | null;
  body_fat_pct: number | null;
  unit_pref: "kg" | "lbs";
  group_id: string | null;
  has_used_retrospective: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  beginSignIn: () => void;
  cancelSignIn: () => void;
  signIn: (addressOverride?: `0x${string}`) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  devMode: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  beginSignIn: () => {},
  cancelSignIn: () => {},
  signIn: async () => false as boolean,
  signOut: async () => {},
  updateUser: () => {},
  devMode: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!IS_DEV_MODE);
  const signingIn = useRef(false);

  const beginSignIn = useCallback(() => {
    signingIn.current = true;
    setLoading(true);
  }, []);

  const cancelSignIn = useCallback(() => {
    signingIn.current = false;
    setLoading(false);
  }, []);

  // Check existing session on mount / wallet change
  useEffect(() => {
    if (IS_DEV_MODE) return;
    if (signingIn.current) return;

    async function checkSession() {
      if (signingIn.current) return;
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        if (signingIn.current) return;
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        if (!signingIn.current) setUser(null);
      }
      if (!signingIn.current) setLoading(false);
    }
    checkSession();
  }, [address]);

  const signIn = useCallback(async (addressOverride?: `0x${string}`): Promise<boolean> => {
    const addr = addressOverride ?? address;
    if (IS_DEV_MODE) {
      setUser(DEV_USER);
      signingIn.current = false;
      return true;
    }
    if (!addr) {
      signingIn.current = false;
      setLoading(false);
      return false;
    }
    signingIn.current = true;
    setLoading(true);
    try {
      const nonceRes = await fetch("/api/auth/nonce", { method: "POST" });
      const { nonce } = await nonceRes.json();

      const message = `Sign in to BurnFat.fun\n\nNonce: ${nonce}`;
      const signature = await signMessageAsync({ message });

      const res = await fetch("/api/auth/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, signature, message }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setLoading(false);
        return true;
      }
    } catch {
      // User rejected signature or server error
    } finally {
      signingIn.current = false;
    }
    setLoading(false);
    return false;
  }, [address, signMessageAsync]);

  const signOut = useCallback(async () => {
    if (IS_DEV_MODE) {
      setUser(null);
      return;
    }
    try {
      await fetch("/api/auth/disconnect", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    disconnect();
  }, [disconnect]);

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, beginSignIn, cancelSignIn, signIn, signOut, updateUser, devMode: IS_DEV_MODE }}>
      {children}
    </AuthContext.Provider>
  );
}
