"use client"

import { useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { CHAIN_ID_DEC, CHAIN_NAME } from '../config'

function decodeDataUriJson(uri) {
  try {
    const prefix = 'data:application/json;base64,'
    if (uri.startsWith(prefix)) {
      const b64 = uri.slice(prefix.length)
      const json = typeof window !== 'undefined' && window.atob ? atob(b64) : ''
      return JSON.parse(json)
    }
  } catch {}
  return null
}

export default function ArtifactsWindow() {
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [scannedTo, setScannedTo] = useState(8)

  const contractAddr = useMemo(() => (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SWAN_COLLECTION_ADDRESS) ? process.env.NEXT_PUBLIC_SWAN_COLLECTION_ADDRESS : '', [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return
    const eth = window.ethereum
    eth.request({ method: 'eth_accounts' }).then((accs) => setAccount(accs?.[0] || ''), () => {})
    eth.request({ method: 'eth_chainId' }).then((id) => setChainId(id || ''), () => {})
    const onAccs = (accs) => setAccount(accs?.[0] || '')
    const onChain = (id) => setChainId(id || '')
    eth.on?.('accountsChanged', onAccs)
    eth.on?.('chainChanged', onChain)
    return () => {
      eth.removeListener?.('accountsChanged', onAccs)
      eth.removeListener?.('chainChanged', onChain)
    }
  }, [])

  async function fetchArtifacts() {
    setError('')
    setItems([])
    if (!window?.ethereum) { setError('No wallet found'); return }
    if (!contractAddr) { setError('Set NEXT_PUBLIC_SWAN_COLLECTION_ADDRESS'); return }
    try {
      setLoading(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const addr = await signer.getAddress()
      if (!addr) { setError('Connect wallet'); setLoading(false); return }
      const abi = [
        { inputs: [{ name: 'accounts', type: 'address[]' }, { name: 'ids', type: 'uint256[]' }], name: 'balanceOfBatch', outputs: [{ type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
        { inputs: [{ name: 'id', type: 'uint256' }], name: 'uri', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
      ]
      const collection = new ethers.Contract(contractAddr, abi, provider)
      const ids = Array.from({ length: scannedTo + 1 }, (_, i) => i)
      const accounts = new Array(ids.length).fill(addr)
      let balances = []
      try {
        balances = await collection.balanceOfBatch(accounts, ids)
      } catch (e) {
        const balAbi = [{ inputs: [{ name: 'account', type: 'address' }, { name: 'id', type: 'uint256' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }]
        const col2 = new ethers.Contract(contractAddr, balAbi, provider)
        balances = []
        for (const id of ids) {
          try { balances.push(await col2.balanceOf(addr, id)) } catch { balances.push(0n) }
        }
      }
      const ownedIds = ids.filter((_, idx) => (balances?.[idx] || 0n) > 0n)
      const results = []
      for (const id of ownedIds) {
        try {
          const u = await collection.uri(id)
          const meta = decodeDataUriJson(u) || {}
          results.push({ id, uri: u, meta, balance: (balances[ids.indexOf(id)] || 0n).toString() })
        } catch {
          results.push({ id, uri: '', meta: {}, balance: (balances[ids.indexOf(id)] || 0n).toString() })
        }
      }
      setItems(results)
    } catch (e) {
      setError('Failed to load artifacts')
    } finally {
      setLoading(false)
    }
  }

  const wrongNet = !!(chainId && parseInt(chainId, 16) !== CHAIN_ID_DEC)

  return (
    <div>
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom: 16 }}>
        <button onClick={fetchArtifacts} disabled={loading} style={{ background:'#111', color:'#ddd', border:'1px solid #333', padding:'6px 10px', borderRadius:6, cursor:'pointer' }}>{loading ? 'Loading…' : 'Refresh'}</button>
        <label style={{ opacity: .8 }}>
          Scan up to ID:&nbsp;
          <input type="number" min={0} value={scannedTo} onChange={(e)=>setScannedTo(Math.max(0, Number(e.target.value)||0))} style={{ width:80, background:'#0f0f0f', color:'#e6e6e6', border:'1px solid #333', borderRadius:6, padding:'4px 6px' }} />
        </label>
        <span style={{ opacity:.75 }}>Network: {wrongNet ? 'Wrong ('+chainId+')' : CHAIN_NAME}</span>
        <span style={{ opacity:.75 }}>Account: {account ? account.slice(0,6)+'…'+account.slice(-4) : '—'}</span>
        {contractAddr ? null : <span style={{ color:'#ff6666' }}>Set NEXT_PUBLIC_SWAN_COLLECTION_ADDRESS</span>}
      </div>
      {error && <div style={{ color:'#ff6666', marginBottom: 12 }}>{error}</div>}
      {items.length === 0 && !loading && (
        <div style={{ opacity:.8 }}>No artifacts found in the scanned range.</div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16 }}>
        {items.map((it) => (
          <div key={it.id} style={{ border:'1px solid #222', background:'#111', borderRadius:8, overflow:'hidden' }}>
            {it.meta?.image ? (
              <img src={it.meta.image} alt={it.meta?.name || `Artifact ${it.id}`} style={{ width:'100%', aspectRatio:'1/1', objectFit:'cover', borderBottom: '1px solid #222' }} />
            ) : (
              <div style={{ width:'100%', aspectRatio:'1/1', background:'#0f0f0f', display:'grid', placeItems:'center', color:'#666' }}>no image</div>
            )}
            <div style={{ padding:12 }}>
              <div style={{ fontFamily:'VT323, monospace', color:'#33ff33', fontSize:20 }}>{it.meta?.name || `Artifact #${it.id}`}</div>
              <div style={{ opacity:.8, marginTop:4, fontSize:13 }}>ID: {it.id} · Balance: {it.balance}</div>
              {it.meta?.level !== undefined && <div style={{ opacity:.8, marginTop:4, fontSize:13 }}>Level: {it.meta.level}</div>}
              {it.meta?.description && <div style={{ opacity:.8, marginTop:8, fontSize:13, lineHeight:1.4 }}>{it.meta.description}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

