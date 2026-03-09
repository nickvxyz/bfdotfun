import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ChallengePool with account:", deployer.address);

  // Base Sepolia USDC
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  const ChallengePool = await ethers.getContractFactory("ChallengePool");
  const pool = await ChallengePool.deploy(USDC_ADDRESS);
  await pool.waitForDeployment();

  const address = await pool.getAddress();
  console.log("ChallengePool deployed to:", address);
  console.log("\nUpdate .env.local:");
  console.log(`NEXT_PUBLIC_CHALLENGE_POOL_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
