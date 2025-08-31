"use client";

import { useEffect, useRef, useState } from 'react'
import Terminal from '../components/Terminal'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export default function Level7() {
  const [message, setMessage] = useState('')
  const [action, setAction] = useState(null) // { label, onClick }
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [locked, setLocked] = useState(false)
  const fullTextRef = useRef([
    'Veils part where your steady footfalls linger,',
    'Echo-trails weaving from chamber to chamber,',
    'Runes breathe again beneath patient sight,',
    'Ink of old vows warming to living light.',
    'Through careful steps you gathered keys,',
    'Amid quiet wards and haunted pleas,',
    'Sworn lamps bloom where courage leans.',
    'Candles crown thresholds no longer unseen,',
    'Your hands remember the way truth begins,',
    'Guarded by swans with vigilant wings,',
    'New doors quiver; their bindings resign—',
    'In scripted initials, the password aligns.'
  ].join('\n'))
  const typingTimerRef = useRef(null)

  const [termOpen, setTermOpen] = useState(false)
  const armedRef = useRef(false)
  const bufferRef = useRef('')

  useEffect(() => {
    let scene, camera, renderer
    const ROOM = { size: 12, wallH: 4 }
    let moveF = false, moveB = false, moveL = false, moveR = false
    const velocity = new THREE.Vector3()
    let prev = performance.now()
    const cameraRot = { h: 0, v: 0 }
    const ROT_LIM = { h: Math.PI/2, v: Math.PI/3 }
    const SENS = { h: 0.0016, v: 0.0012 }
    let swan = null, mesita = null
    let usedBouquet = false
    let mesitaUnlocked = false

    // Setup
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000)
    camera.rotation.order = 'YXZ'
    renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#room7'), antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(devicePixelRatio)
    renderer.shadowMap.enabled = true
    camera.position.set(0, 1.6, 3)
    camera.lookAt(0, 1.6, 0)

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x333333, 0.35))
    const dir = new THREE.DirectionalLight(0xffffff, 0.7)
    dir.position.set(2, 5, 2)
    dir.castShadow = true
    scene.add(dir)
    const fill = new THREE.PointLight(0xffffff, 0.5, 30)
    fill.position.set(0, 2, 0)
    scene.add(fill)

    // Room geometry with texture
    const tex = new THREE.TextureLoader().load('/level7/wall.jpg')
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(4,4)
    tex.anisotropy = 8
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0.05, side: THREE.DoubleSide })
    const floorGeo = new THREE.PlaneGeometry(ROOM.size, ROOM.size)
    const floor = new THREE.Mesh(floorGeo, mat); floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor)
    const ceil = new THREE.Mesh(floorGeo, mat); ceil.rotation.x = Math.PI/2; ceil.position.y = ROOM.wallH; ceil.receiveShadow = true; scene.add(ceil)
    const wallGeo = new THREE.PlaneGeometry(ROOM.size, ROOM.wallH)
    const back = new THREE.Mesh(wallGeo, mat); back.position.set(0, ROOM.wallH/2, -ROOM.size/2); back.receiveShadow = true; scene.add(back)
    const front = new THREE.Mesh(wallGeo, mat); front.position.set(0, ROOM.wallH/2, ROOM.size/2); front.rotation.y = Math.PI; front.receiveShadow = true; scene.add(front)
    const left = new THREE.Mesh(wallGeo, mat); left.position.set(-ROOM.size/2, ROOM.wallH/2, 0); left.rotation.y = Math.PI/2; left.receiveShadow = true; scene.add(left)
    const right = new THREE.Mesh(wallGeo, mat); right.position.set(ROOM.size/2, ROOM.wallH/2, 0); right.rotation.y = -Math.PI/2; right.receiveShadow = true; scene.add(right)

    // Load models
    const loader = new GLTFLoader()
    loader.load('/level7/mesita.glb', (g) => {
      mesita = g.scene
      mesita.scale.set(20, 20, 20)
      mesita.position.set(0, 0, 1.4)
      mesita.rotation.y = Math.PI
      mesita.traverse(o => { o.castShadow = true; o.receiveShadow = true })
      scene.add(mesita)
    })
    loader.load('/level7/swan.glb', (g) => {
      swan = g.scene
      swan.scale.set(1.2, 1.2, 1.2)
      swan.position.set(2.0, 0, 0) // to the right of mesita
      swan.traverse(o => { o.castShadow = true; o.receiveShadow = true })
      scene.add(swan)
    })

    // Single giant bouquet centerpiece (remove previous field of bouquets)
    loader.load(
      '/level7/bouquet.glb',
      (g) => {
        const base = g.scene
        const box = new THREE.Box3().setFromObject(base)
        const yOffset = -box.min.y // lift bottom to floor level
        const giant = base.clone(true)
        // Place it visibly but not blocking the mesita/swan; slightly left of center
        const pos = new THREE.Vector3(-1.8, 0, -0.8)
        const scale = 4.0
        giant.scale.setScalar(scale)
        giant.position.set(pos.x, yOffset * scale, pos.z)
        giant.rotation.y = Math.PI * 0.15
        giant.traverse(o => { o.castShadow = true; o.receiveShadow = true })
        scene.add(giant)
      },
      undefined,
      (err) => { try { console.error('Failed to load bouquet:', err) } catch {} }
    )

    // Input
    const onKeyDown = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': moveF = true; break
        case 'ArrowDown': case 'KeyS': moveB = true; break
        case 'ArrowLeft': case 'KeyA': moveL = true; break
        case 'ArrowRight': case 'KeyD': moveR = true; break
        case 'KeyE': // Context action
          // 1) Use bouquet near swan to unlock
          if (swan && !usedBouquet) {
            const dSwan = swan.position.clone().sub(camera.position).length()
            if (dSwan < 1.8) {
              usedBouquet = true
              mesitaUnlocked = true
              setMessage('The ward dissolves. The night table is unlocked.')
              setAction(null)
              setTimeout(() => setMessage(''), 2000)
              break
            }
          }
          // 2) If unlocked and near mesita, open papyrus with E
          if (mesita && mesitaUnlocked) {
            const dMes = mesita.position.clone().sub(camera.position).length()
            if (dMes < 2.0 && !overlayOpen) {
              openPapyrus()
              break
            }
          }
          break
      }
    }
    const onKeyUp = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': moveF = false; break
        case 'ArrowDown': case 'KeyS': moveB = false; break
        case 'ArrowLeft': case 'KeyA': moveL = false; break
        case 'ArrowRight': case 'KeyD': moveR = false; break
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    const onMouseMove = (e) => {
      if (!document.pointerLockElement) return
      // yaw left/right around Y; pitch up/down around X
      let yaw = cameraRot.h - e.movementX * SENS.h
      let pitch = cameraRot.v - e.movementY * SENS.v
      // Clamp pitch independently so looking sideways doesn't bend up/down
      const vLim = ROT_LIM.v
      if (pitch < -vLim) pitch = -vLim
      if (pitch > vLim) pitch = vLim
      cameraRot.h = yaw
      cameraRot.v = pitch
      camera.rotation.set(pitch, yaw, 0)
    }
    document.addEventListener('mousemove', onMouseMove)
    const onPointerLockChange = () => { setLocked(!!document.pointerLockElement) }
    document.addEventListener('pointerlockchange', onPointerLockChange)
    renderer.domElement.addEventListener('click', () => { renderer.domElement.requestPointerLock?.() })
    window.addEventListener('resize', () => {
      camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight)
    })

    // Helpers
    const updateMove = (dt) => {
      const acc = 10, damp = 6, max = 4.2
      const forward = new THREE.Vector3(); camera.getWorldDirection(forward); forward.y = 0; forward.normalize()
      const rightV = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).normalize()
      const a = new THREE.Vector3(); if (moveF) a.add(forward); if (moveB) a.sub(forward); if (moveR) a.add(rightV); if (moveL) a.sub(rightV)
      if (a.lengthSq()>0){ a.normalize().multiplyScalar(acc); velocity.addScaledVector(a, dt) }
      velocity.x -= velocity.x * damp * dt; velocity.z -= velocity.z * damp * dt
      const sp = Math.hypot(velocity.x, velocity.z); if (sp > max) { const s = max/sp; velocity.x *= s; velocity.z *= s }
      const half = ROOM.size/2 - 0.6
      const nx = camera.position.x + velocity.x*dt; const nz = camera.position.z + velocity.z*dt
      if (Math.abs(nx) < half) camera.position.x = nx; if (Math.abs(nz) < half) camera.position.z = nz
    }

    // UI prompts based on proximity
    const updatePrompts = () => {
      // near mesita
      if (mesita) {
        const d = mesita.position.clone().sub(camera.position).length()
        if (d < 2.0) {
          if (!mesitaUnlocked) {
            setMessage('This night table is warded by the ancient swan, only the swan can open it')
            setAction(null)
          } else if (!overlayOpen) {
            setMessage('The night table hums softly.')
            setAction({ label: 'Open with E', onClick: () => openPapyrus() })
          }
        } else if (message) {
          setMessage(''); setAction(null)
        }
      }
      // near swan
      if (swan && !usedBouquet) {
        const d2 = swan.position.clone().sub(camera.position).length()
        if (d2 < 2.0) {
          setMessage('Use bouquet')
          setAction({ label: 'Press E', onClick: () => {/* keyboard handled */} })
        }
      }
    }

    const openPapyrus = () => {
      setOverlayOpen(true)
      setTyped('')
      if (typingTimerRef.current) clearInterval(typingTimerRef.current)
      const text = fullTextRef.current
      let i = 0
      typingTimerRef.current = setInterval(() => {
        i++
        setTyped(text.slice(0, i))
        if (i >= text.length) { clearInterval(typingTimerRef.current); typingTimerRef.current = null }
      }, 30)
    }

    // Loop
    const loop = () => {
      const now = performance.now(); const dt = Math.min(0.05, (now - prev)/1000); prev = now
      updateMove(dt)
      updatePrompts()
      renderer.render(scene, camera)
      requestAnimationFrame(loop)
    }
    loop()

    return () => {
      try { typingTimerRef.current && clearInterval(typingTimerRef.current) } catch {}
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Escape') {
        try { document.exitPointerLock?.() } catch {}
        try { setLocked(false) } catch {}
        try {
          if (typingTimerRef.current) clearInterval(typingTimerRef.current)
          setOverlayOpen(false)
          setTyped('')
        } catch {}
        armedRef.current = true
        bufferRef.current = ''
        return
      }
      if (!armedRef.current) return
      if (!e.key || e.key.length !== 1) return
      const ch = e.key.toLowerCase()
      if (!/[a-z]/.test(ch)) return
      bufferRef.current = (bufferRef.current + ch).slice(-4)
      if (bufferRef.current === 'swan') { setTermOpen(true); armedRef.current = false; bufferRef.current = '' }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main style={{ width:'100vw', height:'100vh', background:'#000', overflow:'hidden' }}>
      <canvas id="room7" style={{ width:'100%', height:'100%', display:'block', cursor: locked ? 'none' : 'crosshair' }} />
      {/* On-screen ESC button to release pointer lock and arm terminal trigger */}
      <button
        onClick={() => {
          try { document.exitPointerLock?.() } catch {}
          try { setLocked(false) } catch {}
          // Close papyrus overlay if open
          try {
            if (typingTimerRef.current) clearInterval(typingTimerRef.current)
            setOverlayOpen(false)
            setTyped('')
          } catch {}
          // Arm the SWAN terminal trigger (like pressing the keyboard ESC)
          armedRef.current = true
          bufferRef.current = ''
        }}
        style={{
          position:'fixed',
          top:12,
          right:12,
          zIndex: 40,
          background:'#161616',
          color:'#ddd',
          border:'1px solid #333',
          padding:'6px 10px',
          cursor:'pointer',
          opacity: 0.9,
          display: 'inline-block',
        }}
      >ESC</button>
      {!locked && !overlayOpen && (
        <div style={{ position:'fixed', inset:0, display:'grid', placeItems:'center', pointerEvents:'none' }}>
          <div style={{ color:'#e6e6e6', background:'rgba(0,0,0,0.6)', border:'1px solid #333', padding:'10px 14px', fontSize:14 }}>
            Click to look around • ESC to release • WASD to move
          </div>
        </div>
      )}
      {/* Message + action UI */}
      {(message || action) && (
        <div style={{ position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)', display:'grid', gap:8, placeItems:'center', zIndex: 20 }}>
          {message && <div style={{ color:'#e6e6e6', background:'rgba(0,0,0,0.6)', border:'1px solid #333', padding:'8px 12px' }}>{message}</div>}
          {action && <button onClick={action.onClick} style={{ background:'#1a1a3a', color:'#fff', border:'1px solid #333', padding:'6px 10px', cursor:'pointer' }}>{action.label}</button>}
        </div>
      )}
      {/* Papyrus overlay */}
      {overlayOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'grid', placeItems:'center', zIndex: 30 }}>
          <div style={{ display:'grid', gap:18, justifyItems:'center' }}>
            <div style={{ position:'relative', width:'min(90vw, 900px)' }}>
              <img src="/level7/papyrus.png" alt="Papyrus" style={{ width:'100%', height:'auto', display:'block' }} />
              {/* Poem written over the papyrus */}
              <div
                style={{
                  position:'absolute',
                  top:'18%',
                  left:'50%',
                  transform:'translateX(-50%)',
                  width:'82%',
                  color:'#2c1f14',
                  fontFamily:'cursive',
                  whiteSpace:'pre-wrap',
                  lineHeight:1.4,
                  fontSize:'clamp(14px, 2.2vw, 22px)',
                  textAlign:'center',
                  pointerEvents:'none',
                  textShadow:'0 1px 0 rgba(255,255,255,0.25)'
                }}
              >
                {typed}
              </div>
            </div>
            <button onClick={() => setOverlayOpen(false)} style={{ background:'#161616', color:'#ccc', border:'1px solid #333', padding:'8px 12px', cursor:'pointer' }}>Close</button>
          </div>
        </div>
      )}
      <Terminal open={termOpen} onClose={() => setTermOpen(false)} mode="level7" />
    </main>
  )
}
