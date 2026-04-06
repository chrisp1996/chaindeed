import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC");

  // Deploy PropertyDeed first
  const PropertyDeed = await ethers.getContractFactory("PropertyDeed");
  const propertyDeed = await PropertyDeed.deploy();
  await propertyDeed.waitForDeployment();
  console.log("PropertyDeed deployed to:", await propertyDeed.getAddress());

  // Deploy FractionalProperty (example)
  // In production, deploy per property via factory pattern

  console.log("\nDeployment complete!");
  console.log("PropertyDeed:", await propertyDeed.getAddress());
  console.log("\nAdd these to your .env.local:");
  console.log(`NEXT_PUBLIC_PROPERTY_DEED_ADDRESS=${await propertyDeed.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
