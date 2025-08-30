const hre = require("hardhat");

// Configure via env vars
// COLLECTION_ADDRESS: deployed SwanCollection
// TOKEN_ID (default: 0)
// BOUQUET_NAME, BOUQUET_DESC, BOUQUET_IMAGE_URL, BOUQUET_LEVEL, BOUQUET_PRICE

async function main() {
  const collectionAddress = process.env.COLLECTION_ADDRESS;
  if (!collectionAddress) throw new Error('Missing COLLECTION_ADDRESS');

  const tokenId = Number(process.env.TOKEN_ID || '0');
  const name = process.env.BOUQUET_NAME || 'Bouquet';
  const description = process.env.BOUQUET_DESC || 'This bouquet will help you make the swans reveal their secrets to you with its enchanting smell. It may be used anytime.';
  const image = process.env.BOUQUET_IMAGE_URL || 'https://example.com/images/bouquet.jpg';
  const level = Number(process.env.BOUQUET_LEVEL || '0');
  const price = BigInt(process.env.BOUQUET_PRICE || '0');

  const SwanCollection = await hre.ethers.getContractFactory('SwanCollection');
  const collection = SwanCollection.attach(collectionAddress);

  console.log('Setting metadata on', collectionAddress, 'tokenId', tokenId);
  const tx = await collection.setTokenMetadata(tokenId, name, description, image, level, price);
  console.log('Tx sent:', tx.hash);
  await tx.wait();
  console.log(`Metadata set for tokenId ${tokenId}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
