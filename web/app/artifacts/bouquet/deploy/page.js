export const metadata = { title: 'Deploy Bouquet NFT' }

export default function DeployBouquetPage() {
  return (
    <main style={{padding: 24, color: '#e6e6e6', background: '#0b0b0b', minHeight: '100vh'}}>
      <h1 style={{fontFamily: 'VT323, monospace', color: '#33ff33'}}>Deploy the Bouquet NFT (Base Sepolia)</h1>
      <ol>
        <li>cd <code>nfts</code></li>
        <li>npm install</li>
        <li>Set your RPC and private key in <code>.env</code> (create it):
          <pre style={{whiteSpace: 'pre-wrap', background: '#111', padding: 12, borderRadius: 8, border: '1px solid #222'}}>{`BASE_SEPOLIA_RPC_URL=...\nPRIVATE_KEY=0x...`}</pre>
        </li>
        <li>Add Base Sepolia network to <code>hardhat.config.js</code> if not present:
          <pre style={{whiteSpace: 'pre-wrap', background: '#111', padding: 12, borderRadius: 8, border: '1px solid #222'}}>{`networks: {\n  'base-sepolia': {\n    url: process.env.BASE_SEPOLIA_RPC_URL,\n    accounts: [process.env.PRIVATE_KEY]\n  }\n}`}</pre>
        </li>
        <li>Deploy both contracts:
          <pre style={{whiteSpace: 'pre-wrap', background: '#111', padding: 12, borderRadius: 8, border: '1px solid #222'}}>{`npx hardhat run --network base-sepolia scripts/deploy.js`}</pre>
        </li>
        <li>Set token metadata for Bouquet (tokenId 0):
          <pre style={{whiteSpace: 'pre-wrap', background: '#111', padding: 12, borderRadius: 8, border: '1px solid #222'}}>{`npx hardhat run --network base-sepolia scripts/setMetadata.js`}</pre>
        </li>
        <li>Set <code>NEXT_PUBLIC_BOUQUET_NFT_URL</code> in <code>web/.env.local</code> to your marketplace/mint URL.</li>
      </ol>
      <p style={{opacity: .8}}>Tip: Use the image URL <code>{`https://<your-domain>/images/bouquet.jpg`}</code> when setting metadata.</p>
    </main>
  )
}

