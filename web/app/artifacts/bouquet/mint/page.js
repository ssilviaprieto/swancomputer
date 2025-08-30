"use client"

import { useState } from 'react'

export default function BouquetMintPage() {
  const [account, setAccount] = useState('')
  const [status, setStatus] = useState('')
  const [txHash, setTxHash] = useState('')

  const contract = process.env.NEXT_PUBLIC_BOUQUET_NFT_ADDRESS || ''
  const imageUrl = '/images/bouquet.jpeg'
  const marketUrl = process.env.NEXT_PUBLIC_BOUQUET_NFT_URL || ''

  async function connect() {
    try {
      if (!window?.ethereum) {
        setStatus('No wallet detected. Install MetaMask.')
        return
      }
      const [addr] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAccount(addr)
      setStatus('Connected')
    } catch (e) {
      setStatus('Connect failed')
    }
  }

  async function mint() {
    try {
      if (!contract) { setStatus('Set NEXT_PUBLIC_BOUQUET_NFT_ADDRESS'); return }
      if (!window?.ethereum) { setStatus('No wallet'); return }
      setStatus('Preparing mint...')
      const { ethers } = await import('https://cdn.jsdelivr.net/npm/ethers@6.13.1/+esm')
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const abi = [
        { inputs: [], name: 'mint', outputs: [{type:'uint256', name:'tokenId'}], stateMutability: 'nonpayable', type: 'function' }
      ]
      const nft = new ethers.Contract(contract, abi, signer)
      const tx = await nft.mint()
      setStatus('Minting...')
      const receipt = await tx.wait()
      const hash = (receipt && receipt.hash) || tx.hash
      setTxHash(hash)
      setStatus('Minted!')
    } catch (e) {
      console.error(e)
      setStatus('Mint failed')
    }
  }

  return (
    <main style={{minHeight: '100vh', background: '#0b0b0b', color: '#e6e6e6', display: 'grid', placeItems: 'center', padding: 24}}>
      <div style={{width: 'min(820px, 95vw)', background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20}}>
        <h1 style={{marginTop: 0, fontFamily: 'VT323, monospace', color: '#33ff33'}}>Mint: Bouquet</h1>
        <p style={{opacity: .8}}>Mint a Bouquet NFT to carry forward in your journey.</p>
        <img src={imageUrl} alt="Bouquet" style={{maxWidth: '100%', borderRadius: 8, border: '1px solid #333'}} />
        <div style={{display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center'}}>
          <button onClick={connect} style={{background:'#1a5c1a', color:'#fff', border:'1px solid #2a7c2a', borderRadius:8, padding:'8px 12px', cursor:'pointer'}}>Connect Wallet</button>
          <span style={{opacity: .8}}>{account ? `Connected: ${account.slice(0,6)}…${account.slice(-4)}` : status}</span>
        </div>
        <div style={{marginTop: 12}}>
          <div style={{opacity: .8}}>Contract: <code>{contract || '(set NEXT_PUBLIC_BOUQUET_NFT_ADDRESS)'}</code></div>
        </div>
        <div style={{marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap'}}>
          <button onClick={mint} style={{background:'#1a1a3a', color:'#fff', border:'1px solid #333', borderRadius:8, padding:'8px 12px', cursor:'pointer'}}>Mint</button>
          {marketUrl && <a href={marketUrl} target="_blank" rel="noopener noreferrer" style={{background:'#161616', color:'#fff', border:'1px solid #333', borderRadius:8, padding:'8px 12px', textDecoration:'none'}}>Buy on Marketplace</a>}
        </div>
      {txHash && <div style={{marginTop: 10, opacity: .8}}>Tx: <code>{txHash}</code></div>}
      </div>
    </main>
  )
}
