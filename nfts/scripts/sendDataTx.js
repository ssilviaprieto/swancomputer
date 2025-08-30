const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const to = deployer.address; // send to same address (self)

  // Data bytes (decimal codes with leading zeros):
  // "056 051 032 057 055 032 049 049 054 032 049 049 049 032 049 049 053 032 049 048 052 032 049 048 053 032 051 050 032 055 056 032 057 055 032 049 048 055 032 057 055 032 049 048 057 032 049 049 049 032 049 049 054 032 049 049 049"
  const coded = "056 051 032 057 055 032 049 049 054 032 049 049 049 032 049 049 053 032 049 048 052 032 049 048 053 032 051 050 032 055 056 032 057 055 032 049 048 055 032 057 055 032 049 048 057 032 049 049 049 032 049 049 054 032 049 049 049";
  const bytes = Uint8Array.from(coded.split(/\s+/).map((s) => parseInt(s, 10)));
  const data = '0x' + Buffer.from(bytes).toString('hex');

  console.log('Sending tx from deployer to self with data...');
  console.log('From/To:', to);
  console.log('Data (utf8):', Buffer.from(bytes).toString('utf8'));

  const tx = await deployer.sendTransaction({ to, value: 0, data });
  console.log('Tx sent:', tx.hash);
  const receipt = await tx.wait();
  console.log('Mined in block:', receipt.blockNumber);
}

main().catch((e) => { console.error(e); process.exit(1); });
