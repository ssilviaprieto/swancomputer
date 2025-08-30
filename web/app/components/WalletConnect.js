"use client"

import { useEffect, useState } from 'react'
import { CHAIN_ID_DEC, CHAIN_ID_HEX, CHAIN_NAME, RPC_URLS, EXPLORERS } from '../config'

export default function WalletConnect() {
  const [account, setAccount] = useState(null)
  const [chainOk, setChainOk] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return
    window.ethereum.request({ method: 'eth_accounts' }).then(handleAccounts, () => {})
    window.ethereum.request({ method: 'eth_chainId' }).then((id) => setChainOk(parseInt(id, 16) === CHAIN_ID_DEC), () => {})
    const handleChainChanged = (id) => setChainOk(parseInt(id, 16) === CHAIN_ID_DEC)
    const handleAccountsChanged = (accs) => handleAccounts(accs)
    window.ethereum.on?.('chainChanged', handleChainChanged)
    window.ethereum.on?.('accountsChanged', handleAccountsChanged)
    return () => {
      window.ethereum.removeListener?.('chainChanged', handleChainChanged)
      window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged)
    }
  }, [])

  function handleAccounts(accs) {
    setAccount(accs && accs[0] ? accs[0] : null)
  }

  async function ensureChain() {
    setError('')
    const eth = window.ethereum
    if (!eth) { setError('No wallet found (install MetaMask)'); return false }
    try {
      const id = await eth.request({ method: 'eth_chainId' })
      if (parseInt(id, 16) === CHAIN_ID_DEC) { setChainOk(true); return true }
      // Try switch
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] })
      setChainOk(true)
      return true
    } catch (e) {
      // If not added, add network
      if (e?.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: CHAIN_ID_HEX, chainName: CHAIN_NAME, nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: RPC_URLS, blockExplorerUrls: EXPLORERS }]
          })
          setChainOk(true)
          return true
        } catch (e2) {
          setError('User rejected adding Base Sepolia')
          return false
        }
      }
      setError('Failed to switch chain')
      return false
    }
  }

  async function connect() {
    setError('')
    const eth = window.ethereum
    if (!eth) { setError('No wallet found (install MetaMask)'); return }
    const ok = await ensureChain()
    if (!ok) return
    try {
      const accs = await eth.request({ method: 'eth_requestAccounts' })
      handleAccounts(accs)
    } catch (e) {
      setError('User rejected connection')
    }
  }

  function truncate(addr) { return addr ? addr.slice(0, 6) + '…' + addr.slice(-4) : '' }

  return (
    <div style={{ position:'fixed', top:20, right:20, display:'flex', gap:8, alignItems:'center', zIndex:10 }}>
      {!account ? (
        <button onClick={connect} style={{ padding:'6px 10px', border:'1px solid #2a2a2a', borderRadius:6, background:'#0a0a0a', color:'#33ff33', fontFamily:'VT323, monospace' }}>Connect Wallet</button>
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ padding:'4px 8px', border:'1px solid #2a2a2a', borderRadius:6, background: chainOk ? '#0a1a0a' : '#1a0a0a', color: chainOk ? '#33ff33' : '#ff5555', fontFamily:'VT323, monospace' }}>
            {chainOk ? CHAIN_NAME : 'Wrong Network'}
          </span>
          <span style={{ padding:'4px 8px', border:'1px solid #2a2a2a', borderRadius:6, background:'#111', color:'#9cf', fontFamily:'VT323, monospace' }}>{truncate(account)}</span>
        </div>
      )}
      {error && <span style={{ color:'#ff6666', fontFamily:'VT323, monospace' }}>{error}</span>}
    </div>
  )
}
