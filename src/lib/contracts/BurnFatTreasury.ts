export const BURNFAT_TREASURY_ADDRESS =
  process.env.NEXT_PUBLIC_BURNFAT_CONTRACT_ADDRESS as `0x${string}` | undefined;

export const BURNFAT_TREASURY_ABI = [
  {
    type: "function",
    name: "submitBurn",
    inputs: [
      { name: "kgAmount", type: "uint256", internalType: "uint256" },
      { name: "isRetrospective", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "hasUsedRetrospective",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "PRICE_PER_KG",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "RETROSPECTIVE_PRICE_PER_KG",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "referralPool",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "reservePool",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "operationsWallet",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "BurnSubmitted",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "kgAmount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "usdcAmount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "isRetrospective", type: "bool", indexed: false, internalType: "bool" },
    ],
    anonymous: false,
  },
] as const;
