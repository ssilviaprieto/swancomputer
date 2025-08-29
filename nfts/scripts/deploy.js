const hre = require("hardhat");

async function main() {
  console.log("Deploying Swan Token and Collection...");

  // First deploy the ERC20 token
  console.log("Deploying Swan ERC20 Token...");
  const SwanERC20Token = await hre.ethers.getContractFactory("SwanERC20Token");
  const token = await SwanERC20Token.deploy();

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log(`Swan ERC20 Token deployed to: ${tokenAddress}`);

  // Then deploy the Collection with the token address
  console.log("Deploying Swan Collection...");
  const SwanCollection = await hre.ethers.getContractFactory("SwanCollection");
  const collection = await SwanCollection.deploy(tokenAddress);

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
