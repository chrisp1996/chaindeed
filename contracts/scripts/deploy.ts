import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("===========================================");
  console.log("ChainDeed Contract Deployment");
  console.log("===========================================");
  console.log("Network:   ", network.name);
  console.log("Deployer:  ", deployer.address);
  console.log("Balance:   ", ethers.formatEther(balance), "MATIC");
  console.log("===========================================\n");

  if (balance === 0n) {
    throw new Error("Deployer wallet has no MATIC. Fund it first.");
  }

  const addresses: Record<string, string> = {};

  // 1. Deploy PropertyDeed (ERC-721)
  // Already deployed on Amoy at this address — reuse to save gas
  const existingPropertyDeed = "0x3Be8A8ab30F08A60b4971e2640e2faA76DEF9e30";
  let propertyDeedAddress = existingPropertyDeed;
  if (!existingPropertyDeed) {
    console.log("Deploying PropertyDeed...");
    const PropertyDeed = await ethers.getContractFactory("PropertyDeed");
    const propertyDeed = await PropertyDeed.deploy();
    await propertyDeed.waitForDeployment();
    propertyDeedAddress = await propertyDeed.getAddress();
  }
  addresses.PROPERTY_DEED = propertyDeedAddress;
  console.log("✓ PropertyDeed:", addresses.PROPERTY_DEED, "(reused)");

  // 2. DisputeResolution is deployed per-dispute (needs escrow address + panel)
  // Skipping standalone deploy — instantiated on demand by the backend
  console.log("✓ DisputeResolution: deployed per-dispute (skipped standalone)");

  // Note: SimpleEscrow and RealEstatePurchase are deployed fresh per transaction
  // by the backend API — no singleton needed.
  console.log("✓ SimpleEscrow/RealEstatePurchase: deployed per-transaction by API");

  // 5. Write addresses to file
  const outputPath = path.join(__dirname, "../deployments", `${network.name}.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: addresses,
  };
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n✓ Addresses saved to contracts/deployments/${network.name}.json`);

  // 6. Print env vars to add
  console.log("\n===========================================");
  console.log("Add these to Vercel Environment Variables:");
  console.log("===========================================");
  console.log(`NEXT_PUBLIC_PROPERTY_DEED_ADDRESS=${addresses.PROPERTY_DEED}`);
  console.log(`NEXT_PUBLIC_DEPLOYER_ADDRESS=${deployer.address}`);
  console.log("===========================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
