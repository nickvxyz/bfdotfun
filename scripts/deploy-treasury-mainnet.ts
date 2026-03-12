import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying BurnFatTreasury to Base mainnet with account:", deployer.address);

  // Base mainnet USDC
  const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  // Operations wallet — receives 1/3 of every submission fee
  const OPERATIONS_WALLET = "0x60CF40c1d3797c3B1eaF7D2CB78b9Bf4Da5EeB74";

  const BurnFatTreasury = await ethers.getContractFactory("BurnFatTreasury");
  const treasury = await BurnFatTreasury.deploy(USDC_ADDRESS, OPERATIONS_WALLET);
  await treasury.waitForDeployment();

  const address = await treasury.getAddress();
  console.log("BurnFatTreasury deployed to:", address);
  console.log("\nUpdate .env.local:");
  console.log(`NEXT_PUBLIC_BURNFAT_CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${USDC_ADDRESS}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=8453`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
