"use client"

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Water() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.zIndex = '1'
    canvas.style.pointerEvents = 'none'

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2,
      1,
      1000
    )
    camera.position.z = 100

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)

    const particles = new THREE.Group()
    const waterSymbols = ['.', '~', '≈', '∽']
    const particleCount = 200

    function createTextTexture(text) {
      const c = document.createElement('canvas')
      const ctx = c.getContext('2d')
      c.width = 32
      c.height = 32
      ctx.fillStyle = '#33ff33'
      ctx.font = '24px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, c.width / 2, c.height / 2)
      const texture = new THREE.CanvasTexture(c)
      texture.needsUpdate = true
      return texture
    }

    for (let i = 0; i < particleCount; i++) {
      const symbol = waterSymbols[Math.floor(Math.random() * waterSymbols.length)]
      const texture = createTextTexture(symbol)
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: Math.random() * 0.3 + 0.1 })
      const particle = new THREE.Sprite(material)
      particle.position.x = Math.random() * window.innerWidth - window.innerWidth / 2
      particle.position.y = Math.random() * window.innerHeight - window.innerHeight / 2
      particle.position.z = Math.random() * 100
      const scale = Math.random() * 20 + 10
      particle.scale.set(scale, scale, 1)
      particle.userData = { speedX: Math.random() * 0.5 - 0.25, speedY: Math.random() * 0.5 - 0.25 }
      particles.add(particle)
    }

    scene.add(particles)

    let raf
    const animate = () => {
      raf = requestAnimationFrame(animate)
      particles.children.forEach((p) => {
        p.position.x += p.userData.speedX
        p.position.y += p.userData.speedY
        if (p.position.x > window.innerWidth / 2) p.position.x = -window.innerWidth / 2
        if (p.position.x < -window.innerWidth / 2) p.position.x = window.innerWidth / 2
        if (p.position.y > window.innerHeight / 2) p.position.y = -window.innerHeight / 2
        if (p.position.y < -window.innerHeight / 2) p.position.y = window.innerHeight / 2
        p.material.opacity = Math.random() * 0.3 + 0.1
      })
      renderer.render(scene, camera)
    }

    const onResize = () => {
      camera.left = window.innerWidth / -2
      camera.right = window.innerWidth / 2
      camera.top = window.innerHeight / 2
      camera.bottom = window.innerHeight / -2
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} />
}

