import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying BurnFatTreasury with account:", deployer.address);

  // Base Sepolia USDC
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  const BurnFatTreasury = await ethers.getContractFactory("BurnFatTreasury");
  const treasury = await BurnFatTreasury.deploy(USDC_ADDRESS, deployer.address);
  await treasury.waitForDeployment();

  const address = await treasury.getAddress();
  console.log("BurnFatTreasury deployed to:", address);
  console.log("\nUpdate .env.local:");
  console.log(`NEXT_PUBLIC_BURNFAT_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
