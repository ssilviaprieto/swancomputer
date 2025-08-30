const hre = require("hardhat");

async function main() {
  console.log("Deploying Swan Collection (ERC-1155, free minting)...");

  const SwanCollection = await hre.ethers.getContractFactory("SwanCollection");
  const collection = await SwanCollection.deploy();

  await collection.waitForDeployment();
  const collectionAddress = await collection.getAddress();

  console.log(`Swan Collection deployed to: ${collectionAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
