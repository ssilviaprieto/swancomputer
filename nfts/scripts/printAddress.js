require('dotenv').config();
const { ethers } = require('hardhat');

async function main(){
  const pk = process.env.PRIVATE_KEY;
  if(!pk){ throw new Error('PRIVATE_KEY missing in .env'); }
  const wallet = new (await import('ethers')).Wallet(pk);
  console.log('Deployer address:', wallet.address);
}

main().catch((e)=>{ console.error(e); process.exit(1); });

