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
  const termRef = useRef(null)
  const fitRef = useRef(null)

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
      await import('@xterm/xterm/css/xterm.css')

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
    term.write('> ')

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
        term.writeln('  help     - Show this help message')
        term.writeln('  clear    - Clear the terminal')
        term.writeln('  ls       - List current directory')
        term.writeln('  cd       - Change directory')
        term.writeln('  pwd      - Print working directory')
        term.writeln('  echo     - Repeat a message')
        term.writeln('  inspect  - Inspect an artifact')
        term.write('\r\n> ')
      },
      clear: () => {
        term.clear()
        term.write('> ')
      },
      ls: () => {
        term.writeln('\r\nancient_artifacts/')
        term.writeln('├── key.eth')
        term.writeln('├── book_of_flowers.eth')
        term.writeln('├── lock.eth')
        term.writeln('├── wand.eth')
        term.writeln('└── crown.eth')
        term.write('\r\n> ')
      },
      pwd: () => {
        term.writeln('\r\n/root/ancient/swan')
        term.write('\r\n> ')
      },
      cd: (args) => {
        term.writeln(`\r\nNavigating to ${args[0] || '~'}`)
        term.write('\r\n> ')
      },
      echo: (args) => {
        term.writeln('\r\n' + args.join(' '))
        term.write('\r\n> ')
      },
      inspect: async (args) => {
        const response = await askSwan(`inspect ${args.join(' ')}`)
        term.writeln('\r\n' + response)
        term.write('\r\n> ')
      },
      exit: () => {
        onClose?.()
      }
    }

    async function handleCommand(input) {
      const [cmd, ...args] = input.trim().split(' ')
      if (commands[cmd]) {
        await commands[cmd](args)
        if (cmd !== 'clear' && cmd !== 'echo') {
          const rs = AI_PERSONALITY.responses.command_observed
          term.writeln('\r\n' + rs[Math.floor(Math.random() * rs.length)])
          term.write('\r\n> ')
        }
      } else {
        const response = await askSwan(input)
        term.writeln('\r\n' + response)
        term.write('\r\n> ')
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

  if (!open) return null

  return (
    <div className="terminal-container" role="dialog" aria-modal="true" aria-label="Swan Terminal">
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
