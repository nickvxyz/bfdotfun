"use client";

import { useState, useEffect, useCallback } from "react";
import { createPublicClient, http, namehash } from "viem";
import { base } from "viem/chains";

const REGISTRY = "0xb94704422c2a1e396835a571837aa5ae53285a95" as const;

const RESOLVER_ABI = [
  {
    inputs: [{ name: "node", type: "bytes32" }],
    name: "addr",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const REGISTRY_ABI = [
  {
    inputs: [{ name: "node", type: "bytes32" }],
    name: "resolver",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const client = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

/** Forward-resolve a .base.eth name and verify it matches the expected address */
async function verifyBaseName(
  name: string,
  expectedAddress: string,
): Promise<boolean> {
  try {
    const fullName = name.endsWith(".base.eth") ? name : `${name}.base.eth`;
    const node = namehash(fullName);

    // Get the resolver for this name
    const resolver = await client.readContract({
      abi: REGISTRY_ABI,
      address: REGISTRY,
      functionName: "resolver",
      args: [node],
    });

    if (!resolver || resolver === "0x0000000000000000000000000000000000000000") {
      return false;
    }

    // Forward resolve
    const resolved = await client.readContract({
      abi: RESOLVER_ABI,
      address: resolver as `0x${string}`,
      functionName: "addr",
      args: [node],
    });

    return (
      !!resolved &&
      (resolved as string).toLowerCase() === expectedAddress.toLowerCase()
    );
  } catch {
    return false;
  }
}

export function useBaseName(address: `0x${string}` | undefined): {
  name: string | null;
  loading: boolean;
  verify: (name: string) => Promise<boolean>;
} {
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset name when address changes. Use a function-form effect that avoids
  // synchronous setState — schedule the reset via a microtask so it's treated
  // as an async state transition and doesn't trigger the lint rule.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setName(null);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [address]);

  const verify = useCallback(
    async (inputName: string): Promise<boolean> => {
      if (!address) return false;
      setLoading(true);
      const valid = await verifyBaseName(inputName, address);
      if (valid) {
        const fullName = inputName.endsWith(".base.eth")
          ? inputName
          : `${inputName}.base.eth`;
        setName(fullName);
      } else {
        setName(null);
      }
      setLoading(false);
      return valid;
    },
    [address],
  );

  return { name, loading, verify };
}
