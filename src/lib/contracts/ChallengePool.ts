export const CHALLENGE_POOL_ADDRESS =
  process.env.NEXT_PUBLIC_CHALLENGE_POOL_ADDRESS as `0x${string}` | undefined;

export const CHALLENGE_POOL_ABI = [
  {
    type: "function",
    name: "createChallenge",
    inputs: [
      { name: "prizePool", type: "uint256", internalType: "uint256" },
      { name: "endsAt", type: "uint64", internalType: "uint64" },
      { name: "claimDeadline", type: "uint64", internalType: "uint64" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setMerkleRoot",
    inputs: [
      { name: "challengeId", type: "uint256", internalType: "uint256" },
      { name: "merkleRoot", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimReward",
    inputs: [
      { name: "challengeId", type: "uint256", internalType: "uint256" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "proof", type: "bytes32[]", internalType: "bytes32[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "reclaimUnclaimed",
    inputs: [
      { name: "challengeId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelChallenge",
    inputs: [
      { name: "challengeId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "challenges",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "creator", type: "address", internalType: "address" },
      { name: "prizePool", type: "uint256", internalType: "uint256" },
      { name: "endsAt", type: "uint64", internalType: "uint64" },
      { name: "claimDeadline", type: "uint64", internalType: "uint64" },
      { name: "merkleRoot", type: "bytes32", internalType: "bytes32" },
      { name: "cancelled", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasClaimed",
    inputs: [
      { name: "", type: "uint256", internalType: "uint256" },
      { name: "", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextChallengeId",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "PLATFORM_FEE_BPS",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "ChallengeCreated",
    inputs: [
      { name: "challengeId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "prizePool", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "platformFee", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "endsAt", type: "uint64", indexed: false, internalType: "uint64" },
      { name: "claimDeadline", type: "uint64", indexed: false, internalType: "uint64" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MerkleRootSet",
    inputs: [
      { name: "challengeId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "merkleRoot", type: "bytes32", indexed: false, internalType: "bytes32" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RewardClaimed",
    inputs: [
      { name: "challengeId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ChallengeCancelled",
    inputs: [
      { name: "challengeId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "refund", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
] as const;
