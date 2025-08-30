"use client"

import { useState } from 'react'
import Terminal from '../components/Terminal'
import WalletConnect from '../components/WalletConnect'
import Water from '../components/Water'

export default function ClientHome() {
  const [open, setOpen] = useState(false)
  const [openTab, setOpenTab] = useState(null)

  return (
    <div className="whitepaper-page">
      <Water />
      <WalletConnect />
      <img src="/images/swannobackground.png" alt="Swan" className="swan-image" />
      <main className="whitepaper-container">
        <a href="/home" className="home-button">cd home</a>

        <nav className="game-menu">
          <div className="menu-item" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/level0' }}>&gt; PLAY</div>
          <div className="menu-item" onClick={() => setOpenTab('whitepaper')}>&gt; WHITEPAPER</div>
          <div className="menu-item" onClick={() => setOpenTab('hints')}>&gt; HINTS</div>
          <div className="menu-item" onClick={() => setOpenTab('rules')}>&gt; RULES</div>
        </nav>

        {/* WHITEPAPER */}
        <div id="whitepaper" className={`tab-content ${openTab === 'whitepaper' ? 'active' : ''}`} role="dialog" aria-modal="true" aria-labelledby="whitepaper-title">
          <span className="close-button" onClick={() => setOpenTab(null)} aria-label="Close">×</span>
          <div className="title-row">
            <div className="post-meta">
              <span className="date">March 19, 2024</span>
            </div>
            <h2 id="whitepaper-title"><a href="/swan-poem">Swan Computer</a></h2>
            <div style={{marginLeft:'auto',fontFamily:'VT323,monospace',fontSize:14,background:'#111',color:'#9cf',padding:'4px 8px',border:'1px solid #2a2a2a',borderRadius:4}}>Base Sepolia</div>
          </div>

          <section>
            <p>
              Swan Computer is a treasure hunt with digital art rewards.
            </p>
            <p>
              Find the hidden command to unlock your reward: a unique digital artifact (NFT).
              Each artifact unlocks the next level and grants special features within Swan Computer.
            </p>

            <p className="note">
              &gt; To purchase these digital artifacts, you can use SWAN tokens - our special currency.
            </p>
          </section>

          <section>
            <h2>The World of Swan Computer</h2>
            <ul>
              <li><strong>Art Gallery:</strong> Explore paintings that might contain hidden meanings.</li>
              <li><strong>Directory:</strong> Whoami</li>
            </ul>
          </section>
        </div>

        {/* HINTS */}
        <div id="hints" className={`tab-content ${openTab === 'hints' ? 'active' : ''}`} role="dialog" aria-modal="true" aria-labelledby="hints-title">
          <span className="close-button" onClick={() => setOpenTab(null)} aria-label="Close">×</span>
          <h2 id="hints-title">Hints</h2>
          <ul>
            <li>Source code will guide you almost always</li>
            <li>Swan Computer exists in unexpected places</li>
            <li>Some levels may require googling</li>
            <li>Some paths are hidden in plain sight</li>
            <li>Numbers and text may have special cryptic significance</li>
          </ul>
        </div>

        {/* RULES */}
        <div id="rules" className={`tab-content ${openTab === 'rules' ? 'active' : ''}`} role="dialog" aria-modal="true" aria-labelledby="rules-title">
          <span className="close-button" onClick={() => setOpenTab(null)} aria-label="Close">×</span>
          <h2 id="rules-title">Rules</h2>
          <ul>
            <li>Runs on Base Sepolia (testnet) — use test ETH</li>
            <li>Each level can only be completed once per wallet</li>
            <li>Players must own ALL previous level NFTs to continue playing</li>
            <li>Selling any NFT will pause game progress until repurchased</li>
            <li>NFTs can be freely traded on secondary markets</li>
            <li>Sharing solutions publicly is not allowed</li>
          </ul>
        </div>
      </main>

      <Terminal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
