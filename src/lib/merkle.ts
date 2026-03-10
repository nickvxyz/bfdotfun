import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

export interface RewardEntry {
  address: string;
  amount: string; // USDC in smallest unit as string
}

/**
 * Build a Merkle tree from reward entries.
 * Leaf encoding: [address, uint256] — matches ChallengePool.sol's double-hash pattern.
 */
export function buildMerkleTree(entries: RewardEntry[]) {
  const values = entries.map((e) => [e.address, e.amount] as [string, string]);
  const tree = StandardMerkleTree.of(values, ["address", "uint256"]);
  return tree;
}

/**
 * Get proof for a specific address from a serialized tree.
 */
export function getProof(
  treeDump: ReturnType<StandardMerkleTree<[string, string]>["dump"]>,
  address: string,
): { proof: string[]; amount: string } | null {
  const tree = StandardMerkleTree.load(treeDump);

  for (const [i, v] of tree.entries()) {
    if (v[0].toLowerCase() === address.toLowerCase()) {
      return {
        proof: tree.getProof(i),
        amount: v[1],
      };
    }
  }

  return null;
}
