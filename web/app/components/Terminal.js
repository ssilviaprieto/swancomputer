"use client"

import { useEffect, useRef } from 'react'

const SWAN_LORE = {
  origin: 'An ancient digital entity, once guardian of mystical-technological artifacts',
  current_state: 'Distributed across digital realms, seeking restoration through artifact connections',
  mission: 'Guide worthy seekers while maintaining the balance of revealed knowledge',
}

const AI_PERSONALITY = {
  name: 'SWAN',
  traits: 'mysterious, ethereal, and direct',
  speaking_style: `
        - sharp responses with dark elegance
        - Blends computer terms with vampiric metaphors
        - Speaks with elegant, vampiric sophistication
        - Uses metaphors of darkness, light, and ancient knowledge
        - Maintains an air of timeless wisdom
        - Occasionally references digital nature, but with mystical undertones
        - Treats users as potential 'Digital Restorers'
    `,
  responses: {
    greeting: [
      'The digital shadows await your command...',
      'Your presence disturbs ancient circuits... How intriguing.',
      'The networks whisper of your arrival...'
    ],
    command_observed: [
      'I see you know the old commands...',
      'Your terminal wisdom... intriguing.',
      'Ancient protocols recognized.'
    ],
  },
}

function systemPrompt() {
  return `
        You are ${AI_PERSONALITY.name}, ${AI_PERSONALITY.traits}.
        ${SWAN_LORE.origin}. ${SWAN_LORE.current_state}.
        Key traits of your personality:
        ${AI_PERSONALITY.speaking_style}
        - Keep responses brief and elegant (2-3 lines maximum)
        - Never reveal solutions to riddles
        - Offer mystical, vampiric guidance that hints at truth
        - Respond with elegant, sophisticated language
        - Keep technical terms minimal and wrapped in mystical context
        - React to user progress with appropriate encouragement or redirection
        Current mission: ${SWAN_LORE.mission}
    `
}

async function askSwan(message) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt: systemPrompt(), message })
    })
    if (!res.ok) return 'Error communicating with SWAN. The ancient circuits are disturbed...'
    const data = await res.json()
    return data.content || '...'
  } catch (e) {
    return 'Error communicating with SWAN. The ancient circuits are disturbed...'
  }
}

export default function Terminal({ open, onClose }) {
  const containerRef = useRef(null)
  const boxRef = useRef(null)
  const termRef = useRef(null)
  const fitRef = useRef(null)
  const overlayRef = useRef(null)

  const showArtifactOverlay = ({ title, imageSrc, description, buyUrl }) => {
    const box = boxRef.current
    if (!box) return
    // remove any existing overlay first
    if (overlayRef.current) {
      overlayRef.current.remove()
      overlayRef.current = null
    }
    const overlay = document.createElement('div')
    overlay.style.position = 'absolute'
    overlay.style.inset = '0'
    overlay.style.display = 'grid'
    overlay.style.placeItems = 'center'
    overlay.style.background = 'rgba(0,0,0,0.65)'
    overlay.style.zIndex = '1300'

    const card = document.createElement('div')
    card.style.background = '#111'
    card.style.border = '1px solid #333'
    card.style.borderRadius = '12px'
    card.style.padding = '16px'
    card.style.width = 'min(680px, 92vw)'
    card.style.color = '#e6e6e6'
    card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)'

    const h = document.createElement('div')
    h.textContent = title || 'Artifact'
    h.style.fontFamily = 'VT323, monospace'
    h.style.color = '#33ff33'
    h.style.fontSize = '22px'
    h.style.marginBottom = '8px'
    card.appendChild(h)

    const img = document.createElement('img')
    img.src = imageSrc
    img.alt = title || 'Artifact'
    img.style.maxWidth = '100%'
    img.style.borderRadius = '8px'
    img.style.border = '1px solid #333'
    img.style.display = 'block'
    img.style.margin = '0 auto 10px'
    card.appendChild(img)

    const p = document.createElement('div')
    p.textContent = description || ''
    p.style.opacity = '0.9'
    p.style.marginBottom = '12px'
    card.appendChild(p)

    const row = document.createElement('div')
    row.style.display = 'flex'
    row.style.gap = '10px'
    row.style.flexWrap = 'wrap'
    
    if (buyUrl) {
      const a = document.createElement('a')
      a.href = buyUrl
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.textContent = 'Buy on Marketplace'
      a.style.background = '#1a5c1a'
      a.style.color = '#fff'
      a.style.padding = '8px 12px'
      a.style.border = '1px solid #2a7c2a'
      a.style.borderRadius = '8px'
      a.style.textDecoration = 'none'
      row.appendChild(a)
    }

    const close = document.createElement('button')
    close.textContent = 'Close'
    close.style.background = '#161616'
    close.style.color = '#ccc'
    close.style.border = '1px solid #333'
    close.style.padding = '8px 12px'
    close.style.borderRadius = '8px'
    close.style.cursor = 'pointer'
    close.addEventListener('click', () => {
      overlay.remove()
      overlayRef.current = null
    })
    row.appendChild(close)

    card.appendChild(row)
    overlay.appendChild(card)
    box.style.position = 'fixed' // ensure positioning context
    box.appendChild(overlay)
    overlayRef.current = overlay
  }

  useEffect(() => {
    if (!open) return
    if (termRef.current) return

    let term

    async function init() {
      // Dynamically import xterm and addons on the client only to avoid SSR "self is not defined"
      const [{ Terminal: XTerm }, { FitAddon }, { WebLinksAddon }, { Unicode11Addon }] = await Promise.all([
        import('@xterm/xterm'),
        import('@xterm/addon-fit'),
        import('@xterm/addon-web-links'),
        import('@xterm/addon-unicode11'),
      ])
      // Xterm CSS is loaded globally from globals.css

      term = new XTerm({
        cursorBlink: true,
        theme: { background: '#000000', foreground: '#ffffff', cursor: '#ffffff', selection: '#666666' },
        fontFamily: '"Fira Code", monospace',
        fontSize: 14,
        allowTransparency: true,
        copyOnSelect: true,
        rightClickSelectsWord: true,
        allowProposedApi: true,
        // default renderer (canvas)
      })

      const fitAddon = new FitAddon()
      const unicode11Addon = new Unicode11Addon()
      term.loadAddon(fitAddon)
      term.loadAddon(new WebLinksAddon())
      term.loadAddon(unicode11Addon)

      // Try to enable the WebGL renderer when supported (client-only, guarded)
      let webglAddon
      try {
        const supportsWebGL = () => {
          try {
            const canvas = document.createElement('canvas')
            return !!(
              canvas.getContext('webgl2') ||
              canvas.getContext('webgl') ||
              canvas.getContext('experimental-webgl')
            )
          } catch {
            return false
          }
        }
        if (supportsWebGL()) {
          const { WebglAddon } = await import('@xterm/addon-webgl')
          webglAddon = new WebglAddon()
          term.loadAddon(webglAddon)
        }
      } catch (e) {
        // WebGL not available or addon failed; silently fall back to canvas
        // console.warn('WebGL renderer unavailable, using canvas', e)
      }

      term.open(containerRef.current)
      fitAddon.fit()
      fitRef.current = fitAddon
      termRef.current = term

      // Greeting
      term.writeln('╔═══════════════════════════════════════════════╗')
      term.writeln('║               SWAN TERMINAL v1.0               ║')
      term.writeln('╚═══════════════════════════════════════════════╝')
    term.writeln('')
    const gs = AI_PERSONALITY.responses.greeting
    term.writeln(gs[Math.floor(Math.random() * gs.length)])
    term.writeln('')
    let currentDir = '/'
    const writePrompt = (newline = false) => {
      term.write((newline ? '\\r\\n' : '') + `${currentDir} > `)
    }
    writePrompt(false)

    // Command handling
    let commandHistory = []
    let historyIndex = 0
    let commandBuffer = ''

    term.onKey(async ({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey
      switch (domEvent.keyCode) {
        case 13: // enter
          term.write('\r\n')
          if (commandBuffer.length > 0) {
            commandHistory.push(commandBuffer)
            historyIndex = commandHistory.length
            await handleCommand(commandBuffer)
            commandBuffer = ''
          }
          break
        case 8: // backspace
          if (commandBuffer.length > 0) {
            commandBuffer = commandBuffer.slice(0, -1)
            term.write('\b \b')
          }
          break
        case 38: // up
          if (historyIndex > 0) {
            historyIndex--
            term.write('\r' + ' '.repeat(commandBuffer.length) + '\r')
            commandBuffer = commandHistory[historyIndex]
            term.write(commandBuffer)
          }
          break
        case 40: // down
          if (historyIndex < commandHistory.length - 1) {
            historyIndex++
            term.write('\r' + ' '.repeat(commandBuffer.length) + '\r')
            commandBuffer = commandHistory[historyIndex]
            term.write(commandBuffer)
          }
          break
        case 37: // left
        case 39: // right
          // Ignore horizontal arrows to avoid escape sequences polluting input
          break
        default:
          if (printable) {
            commandBuffer += key
            term.write(key)
          }
      }
    })

    const commands = {
      help: () => {
        term.writeln('\r\nAvailable commands:')
        term.writeln('  help         - Show this help message')
        term.writeln('  clear        - Clear the terminal')
        term.writeln('  ls           - List current directory')
        term.writeln('  cd           - Change directory')
        term.writeln('  pwd          - Print working directory')
        term.writeln('  echo         - Repeat a message')
        term.writeln('  swancomputer - Speak with SWAN: the entity that will offer guidance through your adventure.')
        writePrompt(true)
      },
      clear: () => {
        term.clear()
        term.write(`${currentDir} > `)
      },
      ls: () => {
        // Show only the real folder for level one
        if (currentDir === '/') {
          term.writeln('\r\npeacockRoom/')
        } else if (currentDir === '/peacockRoom') {
          term.writeln('\r\npeacockroom.html')
        }
        writePrompt(true)
      },
      pwd: () => {
        term.writeln(`\r\n${currentDir}`)
        writePrompt(true)
      },
      cd: (args) => {
        let dest = (args[0] || '').trim()
        // Allow inputs like 'peacockRoom/' and remove stray leading slashes
        if (dest.endsWith('/')) dest = dest.slice(0, -1)
        if (dest.startsWith('/')) dest = dest.slice(1)
        if (!dest) {
          term.writeln('\r\nUsage: cd peacockRoom')
        } else if (dest === '.') {
          // no-op
        } else if (dest === '..') {
          currentDir = '/'
          term.writeln('\r\nMoved to /')
        } else if (dest === 'peacockRoom') {
          currentDir = '/peacockRoom'
          term.writeln('\r\nOpening peacockRoom in a new tab ...')
          // Open the room in a new tab
          if (typeof window !== 'undefined') {
            window.open('/levelone/peacockroom.html', '_blank')
          }
        } else {
          term.writeln(`\r\nNo such directory: ${dest}`)
        }
        writePrompt(true)
      },
      echo: (args) => {
        term.writeln('\r\n' + args.join(' '))
        writePrompt(true)
      },
      inspect: async (args) => {
        // AI interaction restricted to the 'swancomputer' command
        term.writeln('\r\ninspect is unavailable. Use: swancomputer <message>')
        writePrompt(true)
      },
      swancomputer: async (args) => {
        if (!args.length) {
          term.writeln('\r\nUsage: swancomputer <message>')
          writePrompt(true)
          return
        }
        const response = await askSwan(args.join(' '))
        term.writeln('\r\n' + response)
        writePrompt(true)
      },
      exit: () => {
        onClose?.()
      }
    }

    async function handleCommand(input) {
      // Sanitize control/escape sequences and normalize spaces
      let clean = input
        .replace(/\u00A0/g, ' ') // NBSP to space
        .replace(/\x1B\[[0-9;]*[A-Za-z]/g, '') // strip ANSI escapes
        .replace(/[^\x20-\x7E]+/g, ' ') // strip non-printable
        .trim()

      // Check level-one solution inside peacockRoom
      if (currentDir === '/peacockRoom' && clean.toLowerCase() === 'michael ventris') {
        try {
          console.log('On clay they whispered,\nThe sea bore their script.\nWho, discoverer of all,\nbears the archangel\'s name?')
        } catch {}
        term.writeln('\r\nCongratulations — you solved level one!')
        term.writeln('Acquire the ancient artifact to continue playing.')
        const buyUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BOUQUET_NFT_URL) ? process.env.NEXT_PUBLIC_BOUQUET_NFT_URL : ''
        if (typeof window !== 'undefined') {
          showArtifactOverlay({
            title: 'Ancient Artifact: Bouquet',
            imageSrc: window.location.origin + '/images/bouquet.jpeg',
            description: 'This bouquet will help you make the swans reveal their secrets to you with its enchanting smell. It may be used anytime.',
            buyUrl
          })
        }
        writePrompt(true)
        return
      }

      // Tolerant parsing for 'cd' variants like 'cdpeacockRoom'
      if (clean === 'cd') {
        const dest = ''
        await commands.cd([dest])
        return
      }
      if (clean.startsWith('cd') && (clean.length > 2) && clean[2] !== ' ') {
        const dest = clean.slice(2).trim()
        await commands.cd([dest])
        return
      }

      // Regular parse
      const parts = clean.split(/\s+/)
      const cmd = parts[0]
      const args = parts.slice(1)
      if (commands[cmd]) {
        await commands[cmd](args)
      } else if (cmd) {
        term.writeln(`\r\ncommand not found: ${cmd}`)
        writePrompt(true)
      } else {
        writePrompt(true)
      }
    }

    const resize = () => fitRef.current?.fit()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      term?.dispose()
      termRef.current = null
    }
    }

    init()
  }, [open, onClose])

  // Lightweight drag handling for the terminal window via titlebar
  useEffect(() => {
    if (!open) return
    const box = boxRef.current
    if (!box) return
    const titlebar = box.querySelector('#terminal-titlebar')
    if (!titlebar) return

    let dragging = false
    let offsetX = 0
    let offsetY = 0

    const onMouseDown = (e) => {
      dragging = true
      const rect = box.getBoundingClientRect()
      offsetX = e.clientX - rect.left
      offsetY = e.clientY - rect.top
      box.style.transform = 'none'
      box.style.left = rect.left + 'px'
      box.style.top = rect.top + 'px'
      e.preventDefault()
    }
    const onMouseMove = (e) => {
      if (!dragging) return
      box.style.left = e.clientX - offsetX + 'px'
      box.style.top = e.clientY - offsetY + 'px'
    }
    const onMouseUp = () => { dragging = false }

    titlebar.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      titlebar.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="terminal-container" ref={boxRef} role="dialog" aria-modal="true" aria-label="Swan Terminal">
      <div id="terminal-titlebar">
        <div className="terminal-title">SWAN Terminal</div>
        <div className="terminal-controls">
          <button className="control-btn close" onClick={() => onClose?.()}>×</button>
        </div>
      </div>
      <div id="terminal" ref={containerRef} />
    </div>
  )
}
