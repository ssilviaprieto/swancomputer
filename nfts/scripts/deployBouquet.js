const hre = require("hardhat");

// Env vars:
// BOUQUET_IMAGE_URL (e.g. https://your-host/images/bouquet.jpeg)
// BOUQUET_NAME (default: Bouquet)
// BOUQUET_DESC (default: in-game description below)

function makeDataTokenURI({ name, description, image }) {
  const json = JSON.stringify({ name, description, image });
  const b64 = Buffer.from(json).toString('base64');
  return `data:application/json;base64,${b64}`;
}

async function main() {
  const image = process.env.BOUQUET_IMAGE_URL;
  if (!image) throw new Error('Missing BOUQUET_IMAGE_URL');
  const name = process.env.BOUQUET_NAME || 'Bouquet';
  const description = process.env.BOUQUET_DESC || 'This bouquet will help you make the swans reveal their secrets to you with its enchanting smell. It may be used anytime.';
  const tokenUri = makeDataTokenURI({ name, description, image });

  console.log('Deploying BouquetNFT with tokenURI (data: URI)...');
  const BouquetNFT = await hre.ethers.getContractFactory('BouquetNFT');
  const nft = await BouquetNFT.deploy(tokenUri);
  await nft.waitForDeployment();
  const addr = await nft.getAddress();
  console.log('BouquetNFT deployed at:', addr);
  console.log('TokenId:', 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

