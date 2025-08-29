"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BootScreen() {
  const elRef = useRef(null)
  const router = useRouter()
  const [centered, setCentered] = useState(false)

  useEffect(() => {
    let typed
    let mounted = true
    ;(async () => {
      const { default: Typed } = await import('typed.js')
      if (!mounted || !elRef.current) return
      typed = new Typed(elRef.current, {
        strings: [
          "Initializing SwanOS...\n" +
            "Checking memory... OK\n" +
            "Decrypting keypair... OK\n" +
            "Establishing connection to Swan Network...\n" +
            "Access granted.\n",
        ],
        typeSpeed: 10,
        backSpeed: 40,
        backDelay: 200,
        startDelay: 200,
        showCursor: true,
        cursorChar: '_',
        onComplete: (self) => {
          if (!elRef.current) return
          elRef.current.innerHTML = 'Welcome to Swan Computer'
          elRef.current.style.fontFamily = 'Ballet, cursive'
          elRef.current.style.fontSize = 'clamp(2rem, 5vw, 4rem)'
          self.cursor && self.cursor.parentNode && self.cursor.parentNode.removeChild(self.cursor)
          // Center the welcome message before navigating
          setCentered(true)
          setTimeout(() => router.replace('/home'), 1000)
        },
        preStringTyped: (arrayPos, self) => {
          if (self && arrayPos < self.strings.length - 1 && elRef.current) {
            elRef.current.innerHTML = ''
          }
        },
      })
    })()

    return () => {
      mounted = false
      if (typed) typed.destroy()
    }
  }, [router])

  const containerStyle = centered
    ? { display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#000', color: '#33ff33', fontFamily: 'VT323, monospace' }
    : { display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', minHeight: '100vh', padding: '20px 24px', background: '#000', color: '#33ff33', fontFamily: 'VT323, monospace' }

  const contentStyle = centered
    ? { whiteSpace: 'pre-wrap', textAlign: 'center', fontSize: 'clamp(2rem, 5vw, 4rem)', fontFamily: 'Ballet, cursive' }
    : { whiteSpace: 'pre-wrap', textAlign: 'left', fontSize: '1.1rem', maxWidth: '800px' }

  return (
    <div style={containerStyle}>
      <div id="boot-sequence" ref={elRef} style={contentStyle} />
    </div>
  )
}
