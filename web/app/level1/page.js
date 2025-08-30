"use client"

import { useEffect, useRef, useState } from 'react'
import Terminal from '../components/Terminal'
// Use local KNIFE icon via bundler so it serves correctly
import knifePng from './KNIFE.png'

const GRID_W = 32
const GRID_H = 20
const CELL = 20
const TICK_MS = 110
const LETTER_SEQUENCE = ['P']

export default function LevelOne() {
  const canvasRef = useRef(null)
  const ytDivRef = useRef(null)
  const ytPlayerRef = useRef(null)
  const ytReadyRef = useRef(false)
  const [muted, setMuted] = useState(true)
  const [collected, setCollected] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentIndexRef = useRef(0)
  const [status, setStatus] = useState('')
  const [termOpen, setTermOpen] = useState(false)
  const awaitingSwanRef = useRef(false)
  const swanBufferRef = useRef('')
  const resetRef = useRef(null)
  const blackoutRef = useRef(false)
  const [blackout, setBlackout] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Insert an HTML comment node so it appears in DevTools Elements
    let songComment
    try {
      songComment = document.createComment(' Which song is playing?... ')
      const root = document.documentElement || document.body
      if (root && root.firstChild) {
        root.insertBefore(songComment, root.firstChild)
      } else if (root) {
        root.appendChild(songComment)
      }
    } catch {}

    // Game state
    let raf, last = 0, acc = 0
    let dir = { x: 1, y: 0 }
    let pendingDir = { x: 1, y: 0 }
    let snake = [ { x: 5, y: Math.floor(GRID_H/2) }, { x: 4, y: Math.floor(GRID_H/2) }, { x: 3, y: Math.floor(GRID_H/2) } ]
    let letter = null // { ch, x, y }
    let growth = 0
    let knives = []
    let lossTimer = null
    let hitFlashUntil = 0
    let bombHits = 0
    let bombsActive = true
    let letterTimer = null
    let knifeTimer = null
    let running = true

    const triggerTypeSwanPrompt = () => {
      // Stop hazards and clear board; enter blackout
      bombsActive = false
      if (knifeTimer) clearTimeout(knifeTimer)
      if (letterTimer) clearTimeout(letterTimer)
      letter = null
      knives = []
      snake = []
      setStatus('')
      awaitingSwanRef.current = true
      blackoutRef.current = true
      setBlackout(true)
      running = false
    }

    const isOccupied = (x,y) => snake.some(p => p.x===x && p.y===y) || knives.some(k => k.x===x && k.y===y)

    const spawnLetterRandom = () => {
      const ch = LETTER_SEQUENCE[currentIndexRef.current]
      if (!ch) return
      for (let tries=0; tries<300; tries++) {
        const x = 1 + Math.floor(Math.random()*(GRID_W-2))
        const y = 1 + Math.floor(Math.random()*(GRID_H-2))
        if (!isOccupied(x,y)) { letter = { ch, x, y }; return }
      }
      letter = { ch, x: 2, y: 2 }
    }

    const scheduleNextLetter = () => {
      if (letterTimer) clearTimeout(letterTimer)
      letterTimer = setTimeout(() => { spawnLetterRandom() }, 3000)
    }

    scheduleNextLetter()

    // Knives spawn periodically
    const spawnKnife = () => {
      for (let tries=0; tries<300; tries++) {
        const x = 1 + Math.floor(Math.random()*(GRID_W-2))
        const y = 1 + Math.floor(Math.random()*(GRID_H-2))
        if (!isOccupied(x,y) && (!letter || (letter.x!==x || letter.y!==y))) { knives.push({x,y}); return }
      }
    }
    const scheduleKnife = () => {
      if (knifeTimer) clearTimeout(knifeTimer)
      if (!bombsActive) return
      // Spawn a little less frequently
      knifeTimer = setTimeout(() => { if (bombsActive) { spawnKnife(); scheduleKnife() } }, 8000)
    }
    scheduleKnife()

    const onKey = (e) => {
      const k = e.code
      if (k==='ArrowUp' || k==='KeyW') { if (dir.y!==1) pendingDir = { x:0,y:-1 } }
      else if (k==='ArrowDown' || k==='KeyS') { if (dir.y!==-1) pendingDir = { x:0,y:1 } }
      else if (k==='ArrowLeft' || k==='KeyA') { if (dir.x!==1) pendingDir = { x:-1,y:0 } }
      else if (k==='ArrowRight' || k==='KeyD') { if (dir.x!==-1) pendingDir = { x:1,y:0 } }
      // Allow typing 'swan' at any time to open the terminal
      if (awaitingSwanRef.current && e.key && e.key.length === 1) {
        const ch = e.key.toLowerCase()
        if (/[a-z]/.test(ch)) {
          swanBufferRef.current = (swanBufferRef.current + ch).slice(-4)
          if (swanBufferRef.current === 'swan') {
            awaitingSwanRef.current = false
            setTermOpen(true)
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)

    // YouTube audio: load API and prepare hidden player (autoplay muted)
    const setupYT = () => {
      if (window.YT && window.YT.Player && ytDivRef.current && !ytPlayerRef.current) {
        ytPlayerRef.current = new window.YT.Player(ytDivRef.current, {
          host: 'https://www.youtube-nocookie.com',
          videoId: 'dF-IMQzd_Jo',
          playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, fs: 0, playsinline: 1 },
          events: {
            onReady: () => { ytReadyRef.current = true; try { ytPlayerRef.current.mute(); ytPlayerRef.current.playVideo() } catch {} },
          },
        })
      }
    }
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.body.appendChild(tag)
      window.onYouTubeIframeAPIReady = () => setupYT()
    } else {
      setupYT()
    }

    const reset = () => {
      if (knifeTimer) clearTimeout(knifeTimer)
      if (letterTimer) clearTimeout(letterTimer)
      if (lossTimer) clearTimeout(lossTimer)
      dir = { x:1, y:0 }
      pendingDir = { x:1, y:0 }
      snake = [ { x: 5, y: Math.floor(GRID_H/2) }, { x: 4, y: Math.floor(GRID_H/2) }, { x: 3, y: Math.floor(GRID_H/2) } ]
      setCollected([])
      setCurrentIndex(0)
      currentIndexRef.current = 0
      letter = null
      growth = 0
      knives = []
      bombHits = 0
      bombsActive = true
      running = true
      scheduleNextLetter()
      scheduleKnife()
      hitFlashUntil = 0
      setStatus('')
      awaitingSwanRef.current = false
      blackoutRef.current = false
      setBlackout(false)
      setBlackout(false)
    }

    // expose reset to UI button
    resetRef.current = reset

    const triggerLoss = () => {
      setStatus('YOU LOST')
      hitFlashUntil = Date.now() + 1000
      running = false
      // hide snake
      snake = []
      if (lossTimer) clearTimeout(lossTimer)
      lossTimer = setTimeout(() => { reset() }, 1000)
    }

    const step = () => {
      dir = pendingDir
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }
      // Wrap around edges
      if (head.x < 0) head.x = GRID_W-1
      if (head.x >= GRID_W) head.x = 0
      if (head.y < 0) head.y = GRID_H-1
      if (head.y >= GRID_H) head.y = 0
      // Self collision
      for (let i=0;i<snake.length;i++) {
        if (snake[i].x===head.x && snake[i].y===head.y) { triggerLoss(); return }
      }
      snake.unshift(head)
      // Eating letter
      if (letter && head.x===letter.x && head.y===letter.y) {
        const nextCh = LETTER_SEQUENCE[currentIndexRef.current]
        if (letter.ch === nextCh) {
          setCollected(prev => [...prev, nextCh])
          const nextIndex = currentIndexRef.current + 1
          currentIndexRef.current = nextIndex
          setCurrentIndex(nextIndex)
          letter = null
          growth += 2
          if (nextIndex >= LETTER_SEQUENCE.length) {
            // All letters collected: stop hazards and enter blackout
            bombsActive = false
            if (knifeTimer) clearTimeout(knifeTimer)
            if (letterTimer) clearTimeout(letterTimer)
            letter = null
            knives = []
            snake = []
            setStatus('')
            awaitingSwanRef.current = true
            blackoutRef.current = true
            setBlackout(true)
            running = false
          } else {
            scheduleNextLetter()
          }
        }
      } else {
        // Knife collision: immediate loss + restart sequence
        for (let i=0;i<knives.length;i++) {
          const k = knives[i]
          if (head.x===k.x && head.y===k.y) {
            knives.splice(i,1)
            triggerLoss();
            return
          }
        }
        // move tail unless growing
        if (growth > 0) { growth-- } else { snake.pop() }
      }
    }

    const drawCell = (x,y, color) => {
      ctx.fillStyle = color
      ctx.fillRect(x*CELL, y*CELL, CELL, CELL)
    }

    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(60,60,60,0.4)'
      ctx.lineWidth = 1
      for (let x=0;x<=GRID_W;x++) { ctx.beginPath(); ctx.moveTo(x*CELL,0); ctx.lineTo(x*CELL, GRID_H*CELL); ctx.stroke() }
      for (let y=0;y<=GRID_H;y++) { ctx.beginPath(); ctx.moveTo(0,y*CELL); ctx.lineTo(GRID_W*CELL, y*CELL); ctx.stroke() }
    }

    const render = () => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0,0,canvas.width,canvas.height)
      if (blackoutRef.current) return
      drawGrid()
      // Letter
      if (letter) {
        ctx.fillStyle = '#ffffff'
        ctx.font = `bold ${Math.floor(CELL*0.8)}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(letter.ch, letter.x*CELL + CELL/2, letter.y*CELL + CELL/2)
      }
      // Knives (draw with image if available)
      for (const k of knives) {
        // Preload image once (use imported asset path)
        if (!window.__knife) {
          const img = new Image();
          img.src = (knifePng && knifePng.src) || knifePng
          window.__knife = img
        }
        const img = window.__knife
        if (img && img.complete && img.naturalWidth>0) {
          ctx.drawImage(img, k.x*CELL, k.y*CELL, CELL, CELL)
        } else {
          ctx.fillStyle = '#ff4444'
          ctx.fillRect(k.x*CELL+CELL*0.25, k.y*CELL+CELL*0.1, CELL*0.5, CELL*0.8)
        }
      }
      // Snake
      for (let i=snake.length-1;i>=0;i--) {
        const s = snake[i]
        const c = i===0 ? '#33ff33' : 'rgba(51,255,51,0.7)'
        drawCell(s.x, s.y, c)
      }
      // Status (hide when awaiting SWAN prompt)
      if (!awaitingSwanRef.current && status) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.font = '16px monospace'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(status, 8, 8)
      }

      // Centered loss flash overlay
      if (Date.now() < hitFlashUntil) {
        ctx.save()
        ctx.fillStyle = '#ff3333'
        const size = Math.floor(Math.min(canvas.width, canvas.height) * 0.2)
        ctx.font = `bold ${size}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('YOU LOST', canvas.width/2, canvas.height/2)
        ctx.restore()
      }

      // Full black overlay with huge black text when awaiting SWAN
      if (awaitingSwanRef.current && status) {
        ctx.save()
        // Fill full black (page already black, ensure overlay)
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        // Huge text, also in black (as requested)
        const size = Math.floor(Math.min(canvas.width, canvas.height) * 0.35)
        ctx.font = `900 ${size}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#000000'
        ctx.fillText(status, canvas.width/2, canvas.height/2)
        ctx.restore()
      }
    }

    const loop = (ts) => {
      raf = requestAnimationFrame(loop)
      if (!last) last = ts
      const dt = ts - last
      last = ts
      acc += dt
      while (acc >= TICK_MS && running) {
        step()
        acc -= TICK_MS
      }
      render()
    }
    canvas.width = GRID_W * CELL
    canvas.height = GRID_H * CELL
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      if (knifeTimer) clearTimeout(knifeTimer)
      if (letterTimer) clearTimeout(letterTimer)
      if (lossTimer) clearTimeout(lossTimer)
      try { songComment?.remove?.() } catch {}
    }
  }, [])

  return (
    <main style={{width:'100vw',minHeight:'100vh',background:'#000',display:'grid',placeItems:'center', paddingBottom: 24}}>
      <div style={{display:'grid', gap:12, justifyItems:'center'}}>
        <canvas ref={canvasRef} style={{border: blackoutRef.current ? 'none' : '1px solid #222', background:'#000'}} />
        {/* Centered selectable text on blackout */}
        <div style={{ position:'fixed', inset:0, display: blackout ? 'grid' : 'none', placeItems:'center', zIndex: 10 }}>
          <div style={{ color:'#000000', fontWeight:900, fontFamily:'Ballet, sans-serif', fontSize:'min(20vw, 160px)', letterSpacing:'0.04em', userSelect:'text', WebkitUserSelect:'text', MozUserSelect:'text', msUserSelect:'text', textAlign:'center' }}>
            Type swan
          </div>
        </div>
        {/* Centered selectable text on blackout */}
        <div style={{ position:'fixed', inset:0, display: blackout ? 'grid' : 'none', placeItems:'center', zIndex: 10 }}>
          <div style={{ color:'#000000', fontWeight:900, fontFamily:'Ballet, sans-serif', fontSize:'min(20vw, 160px)', letterSpacing:'0.04em', userSelect:'text', WebkitUserSelect:'text', MozUserSelect:'text', msUserSelect:'text', textAlign:'center' }}>
            Type swan
          </div>
        </div>
        {!blackoutRef.current && (
        <div style={{display:'flex', alignItems:'center', gap:8, width: GRID_W*CELL}}>
          <button onClick={() => { if (resetRef.current) resetRef.current() }} style={{background:'#161616', color:'#ddd', border:'1px solid #333', padding:'6px 10px', borderRadius:4, cursor:'pointer'}}>Restart</button>
          <button onClick={() => {
            if (!ytPlayerRef.current) return
            try {
              if (muted) { ytPlayerRef.current.unMute(); setMuted(false) }
              else { ytPlayerRef.current.mute(); setMuted(true) }
            } catch {}
          }} style={{background:'#111', color:'#ddd', border:'1px solid #333', padding:'6px 10px', borderRadius:4, cursor:'pointer'}}>Sound {muted ? 'Off' : 'On'}</button>
          <span style={{opacity:.7, color:'#ccc'}}>Music playing…</span>
        </div>
        )}
        {/* Hidden YouTube player (audio only) */}
        <div ref={ytDivRef} style={{width:1, height:1, opacity:0, display:'none', pointerEvents:'none', overflow:'hidden'}} aria-hidden="true" />
      </div>
      <Terminal open={termOpen} onClose={() => setTermOpen(false)} />
    </main>
  )
}
