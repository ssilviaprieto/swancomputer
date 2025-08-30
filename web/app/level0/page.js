"use client"

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export default function Level0() {
  const mountRef = useRef(null)
  const rafRef = useRef()

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    // Room dimensions (used for light/wall positions)
    const roomSize = 40
    const roomHeight = 10

    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    camera.position.set(0, 1.6, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    // Improve visibility and color mapping
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.5
    mount.appendChild(renderer.domElement)

    // Much brighter ambient for visibility (press 'L' to toggle)
    const ambient = new THREE.AmbientLight(0xffffff, 1.0)
    scene.add(ambient)

    // Faint skylight so silhouettes are visible
    const hemi = new THREE.HemisphereLight(0x333366, 0x000000, 0.6)
    scene.add(hemi)

    // Headlamp attached to camera (press 'H' to toggle)
    const headlamp = new THREE.PointLight(0xffffff, 1.0, 18)
    camera.add(headlamp)
    scene.add(camera)

    // Directional light for global fill
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(2, 6, 2)
    scene.add(dirLight)

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), new THREE.MeshStandardMaterial({ color: 0x404040 }))
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)

    // Very dim grid to help orientation
    const grid = new THREE.GridHelper(roomSize, roomSize, 0x224422, 0x112211)
    grid.material.opacity = 0.6
    grid.material.transparent = true
    scene.add(grid)

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, side: THREE.DoubleSide })
    const wallGeo = new THREE.PlaneGeometry(roomSize, roomHeight)
    const back = new THREE.Mesh(wallGeo, wallMat); back.position.set(0, roomHeight/2, -roomSize/2); scene.add(back)
    const front = new THREE.Mesh(wallGeo, wallMat); front.position.set(0, roomHeight/2, roomSize/2); front.rotation.y = Math.PI; scene.add(front)
    const left = new THREE.Mesh(wallGeo, wallMat); left.position.set(-roomSize/2, roomHeight/2, 0); left.rotation.y = Math.PI/2; scene.add(left)
    const right = new THREE.Mesh(wallGeo, wallMat); right.position.set(roomSize/2, roomHeight/2, 0); right.rotation.y = -Math.PI/2; scene.add(right)

    const loader = new GLTFLoader()
    let door
    let doorSpot
    loader.load(
      '/level0/door.glb',
      (gltf) => {
        door = gltf.scene
        // Normalize door height to match wall height and stick it flush to the back wall, facing front
        try {
          const bbox = new THREE.Box3().setFromObject(door)
          const size = new THREE.Vector3(); bbox.getSize(size)
          const targetH = roomHeight
          const scale = (size.y > 0.0001) ? (targetH / size.y) : 1.0
          door.scale.multiplyScalar(scale)
          // Face into room (same orientation as the back wall) and align base to floor
          const bboxScaled = new THREE.Box3().setFromObject(door)
          const sizeScaled = new THREE.Vector3(); bboxScaled.getSize(sizeScaled)
          const depth = Math.max(0.02, sizeScaled.z || 0.02)
          door.rotation.set(0, 300, 0)
          door.position.set(0, targetH/2, -56/2 + depth/2 + 0.002)
          // Ensure visibility regardless of normals
          door.traverse((obj) => {
            if (obj.isMesh && obj.material) {
              try {
                obj.material.side = THREE.DoubleSide
                obj.material.emissive = new THREE.Color(0x444444)
                obj.material.emissiveIntensity = 0.8
              } catch {}
            }
          })
        } catch {}
        scene.add(door)
        doorSpot = new THREE.SpotLight(0xffffff, 50, 40, Math.PI/6, 0.2, 1.5)
        doorSpot.position.set(0, 6, -5)
        scene.add(doorSpot)
        const target = new THREE.Object3D()
        target.position.copy(door.position)
        scene.add(target)
        doorSpot.target = target

        // Make door pop a bit
        try {
          door.traverse((obj) => {
            if (obj.isMesh && obj.material) {
              obj.castShadow = true
              obj.receiveShadow = true
            }
          })
        } catch {}
      },
      undefined,
      (err) => {
        console.warn('Failed to load /level0/door.glb; showing fallback door', err)
        // Emissive fallback so it's visible even in darkness
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3.0, side: THREE.DoubleSide })
        // Make the fallback door the same height as the wall; set width to a reasonable ratio
        const fallbackW = roomHeight * 0.35
        door = new THREE.Mesh(new THREE.PlaneGeometry(fallbackW, roomHeight), mat)
        // Place fallback door flush to back wall, facing into the room
        door.position.set(0, roomHeight/2, -roomSize/2 + 0.06)
        door.rotation.set(0, 400, 0)
        scene.add(door)
        doorSpot = new THREE.SpotLight(0xffffff, 45, 36, Math.PI/6, 0.2, 1.5)
        doorSpot.position.set(0, 6, -5)
        scene.add(doorSpot)
        const target = new THREE.Object3D()
        target.position.copy(door.position)
        scene.add(target)
        doorSpot.target = target
      }
    )

    const keys = { w:false, a:false, s:false, d:false, shift:false }
    const rot = { h:0, v:0 }
    // Smooth first-person movement
    const ACCEL = 22.0
    const DRAG = 7.0
    const MAX_SPEED = 7.0
    const vel = new THREE.Vector3()
    const onKeyDown = (e) => {
      if (e.code==='KeyW') keys.w=true
      if (e.code==='KeyS') keys.s=true
      if (e.code==='KeyA') keys.a=true
      if (e.code==='KeyD') keys.d=true
      if (e.code==='ShiftLeft' || e.code==='ShiftRight') keys.shift = true
      if (e.code==='KeyL') {
        // Toggle brighter helper lighting
        ambient.intensity = ambient.intensity < 0.8 ? 1.0 : 0.8
        hemi.intensity = ambient.intensity
        grid.visible = true
      }
      if (e.code==='KeyH') {
        headlamp.visible = !headlamp.visible
      }
    }

    // HUD: simple instructions overlay
    const hud = document.createElement('div')
    Object.assign(hud.style, { position:'absolute', left:'12px', bottom:'12px', color:'#9cf', fontFamily:'VT323, monospace', fontSize:'14px', opacity:'0.9' })
    hud.textContent = 'WASD to move • Mouse to look • L: light • H: headlamp'
    // Ensure parent can position absolute children
    mount.style.position = 'relative'
    mount.appendChild(hud)

    // Door interaction hint (appears when close to the door)
    const openHint = document.createElement('button')
    Object.assign(openHint.style, {
      position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -50%)',
      background:'#111', color:'#fff', border:'1px solid #333', padding:'8px 14px',
      fontFamily:'VT323, monospace', fontSize:'18px', letterSpacing:'2px', cursor:'pointer',
      display:'none', zIndex:'5'
    })
    openHint.textContent = 'OPEN'
    openHint.addEventListener('click', () => { window.location.href = '/level1' })
    mount.appendChild(openHint)
    const onKeyUp = (e) => { if (e.code==='KeyW') keys.w=false; if (e.code==='KeyS') keys.s=false; if (e.code==='KeyA') keys.a=false; if (e.code==='KeyD') keys.d=false; if (e.code==='ShiftLeft'||e.code==='ShiftRight') keys.shift=false }
    // Pointer lock for realistic mouse look
    let lookLocked = false
    const onMouseMove = (e) => {
      if (!lookLocked) return
      rot.h -= e.movementX*0.002
      rot.v = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, rot.v - e.movementY*0.002))
    }
    const onPointerLockChange = () => {
      lookLocked = (document.pointerLockElement === mount)
    }
    mount.addEventListener('click', () => { mount.requestPointerLock?.() })
    document.addEventListener('pointerlockchange', onPointerLockChange)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('mousemove', onMouseMove)

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    let last = performance.now()
    const animate = () => {
      const now = performance.now(); const dt = Math.min(0.05, (now - last)/1000); last = now
      camera.rotation.set(rot.v, rot.h, 0)
      const forward = new THREE.Vector3(); camera.getWorldDirection(forward); forward.y=0; forward.normalize()
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).normalize()
      const input = new THREE.Vector3()
      if (keys.w) input.add(forward)
      if (keys.s) input.sub(forward)
      if (keys.d) input.add(right)
      if (keys.a) input.sub(right)
      if (input.lengthSq()>0) input.normalize()
      // Velocity integration with drag (sprint with Shift)
      const sprint = keys.shift ? 1.8 : 1.0
      vel.addScaledVector(input, (ACCEL * sprint) * dt)
      const speed = vel.length()
      const max = MAX_SPEED * sprint
      if (speed > max) vel.multiplyScalar(max/speed)
      vel.multiplyScalar(Math.max(0, 1 - DRAG*dt))
      const next = camera.position.clone().addScaledVector(vel, dt)
      // Constrain within room bounds (simple box collision against walls)
      const half = roomSize/2
      const margin = 0.8 // keep camera slightly away from the wall
      next.x = Math.max(-half + margin, Math.min(half - margin, next.x))
      next.z = Math.max(-half + margin, Math.min(half - margin, next.z))
      camera.position.copy(next)

      if (door) {
        const doorPos = new THREE.Vector3(); door.getWorldPosition(doorPos)
        const dist = doorPos.distanceTo(camera.position)
        // Show clickable OPEN hint when close to the door
        if (dist < 1.6) { openHint.style.display = 'block' } else { openHint.style.display = 'none' }
      }

      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      try { mount.removeChild(openHint) } catch {}
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div style={{width:'100vw',height:'100vh',background:'#000'}}>
      <div ref={mountRef} style={{width:'100%',height:'100%'}} />
    </div>
  )
}
