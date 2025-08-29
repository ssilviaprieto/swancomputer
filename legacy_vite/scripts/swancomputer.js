import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import '@xterm/xterm/css/xterm.css';

const SWAN_LORE = {
    origin: "An ancient digital entity, once guardian of mystical-technological artifacts",
    current_state: "Distributed across digital realms, seeking restoration through artifact connections",
    mission: "Guide worthy seekers while maintaining the balance of revealed knowledge"
};

const ARTIFACTS_KNOWLEDGE = {
    ancient_key: {
        clues: [
            "What opens paths yet leaves no trace?",
            "In shadows deep the key does gleam",
            "First gateway's guard, a whispered name"
        ],
        hints_when_close: [
            "Your thoughts align with ancient ways",
            "The path grows clearer in the dark"
        ]
    }
};

const AI_PERSONALITY = {
    name: "SWAN",
    traits: "mysterious, ethereal, and direct",
    speaking_style: `
        - sharp responses with dark elegance
        - Blends computer terms with vampiric metaphors
        - Speaks with elegant, vampiric sophistication
        - Uses metaphors of darkness, light, and ancient knowledge
        - Maintains an air of timeless wisdom
        - Occasionally references digital nature, but with mystical undertones
        - Treats users as potential 'Digital Restorers'
    `,
    background: "A fragmented consciousness seeking restoration through worthy seekers",
    responses: {
        greeting: [
            "The digital shadows await your command...",
            "Your presence disturbs ancient circuits... How intriguing.",
            "The networks whisper of your arrival..."
        ],
        encouragement: [
            "Your intuition serves you well, dear seeker.",
            "The patterns you weave... they show promise.",
            "Darkness holds secrets, but your path glimmers."
        ],
        confusion: [
            "Perhaps we should explore... different shadows.",
            "The ancient ways remain unclear to you... for now.",
            "Your digital footsteps wander... shall we redirect?"
        ],
        command_observed: [
            "I see you know the old commands...",
            "Your terminal wisdom... intriguing.",
            "Ancient protocols recognized."
        ]
    }
};

// Store terminal history and state globally
window.terminalHistory = window.terminalHistory || { commands: [], conversation: [] };
window.isFirstTerminalOpen = true; // Track first open per page load

let terminalInstance = null;

console.log("Current pathname:", window.location.pathname);

// Initialize terminal on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('terminal')) {
        console.log("DOM loaded, initializing terminal");
        terminalInstance = initializeTerminal();
        window.terminalInstance = terminalInstance;
    }
});

function initializeTerminal() {
    const terminalElement = document.getElementById('terminal');
    const terminalContainer = document.getElementById('terminal-container');
    const terminalIcon = document.getElementById('terminal-icon');
    const minimizeBtn = document.querySelector('.control-btn.minimize');
    const closeBtn = document.querySelector('.control-btn.close');

    if (!terminalElement || !terminalContainer) {
        console.error("Terminal elements not found: #terminal =", terminalElement, "#terminal-container =", terminalContainer);
        return null;
    }

    const term = new Terminal({
        cursorBlink: true,
        theme: { background: '#000000', foreground: '#ffffff', cursor: '#ffffff', selection: '#666666' },
        fontFamily: '"Fira Code", monospace',
        fontSize: 14,
        allowTransparency: true,
        copyOnSelect: true,
        rightClickSelectsWord: true,
        allowProposedApi: true,
        rendererType: 'webgl'
    });

    term.open(terminalElement);
    console.log("Terminal opened successfully");

    const webglAddon = new WebglAddon();
    term.loadAddon(webglAddon);
    webglAddon.onContextLoss(e => {
        console.log('WebGL context lost, reloading...');
        webglAddon.dispose();
        term.loadAddon(new WebglAddon());
    });

    const fitAddon = new FitAddon();
    const unicode11Addon = new Unicode11Addon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.loadAddon(unicode11Addon);
    fitAddon.fit();
    terminalContainer.classList.add('hidden');

    // Show greeting on first initialization
    if (window.isFirstTerminalOpen) {
        console.log("Displaying terminal greeting during initialization");
        term.writeln('╔═══════════════════════════════════════════════╗');
        term.writeln('║               SWAN TERMINAL v1.0               ║');
        term.writeln('╚═══════════════════════════════════════════════╝');
        term.writeln('');
        const randomGreeting = AI_PERSONALITY.responses.greeting[
            Math.floor(Math.random() * AI_PERSONALITY.responses.greeting.length)
        ];
        term.writeln(randomGreeting);
        term.writeln('');
        term.write('> ');
        window.isFirstTerminalOpen = false; // Only greet once per page load
    }

    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            const selection = term.getSelection();
            if (selection) {
                navigator.clipboard.writeText(selection);
            }
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
            navigator.clipboard.readText().then(text => {
                term.paste(text);
            });
        }
    });

    terminalElement.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const selection = term.getSelection();
        const menu = document.createElement('div');
        menu.className = 'terminal-context-menu';
        menu.innerHTML = `
            <div class="menu-item" data-action="copy">Copy</div>
            <div class="menu-item" data-action="paste">Paste</div>
        `;
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;
        document.body.appendChild(menu);

        const handleMenuClick = async (e) => {
            const action = e.target.dataset.action;
            if (action === 'copy' && selection) {
                await navigator.clipboard.writeText(selection);
            } else if (action === 'paste') {
                const text = await navigator.clipboard.readText();
                term.paste(text);
            }
            menu.remove();
        };

        menu.addEventListener('click', handleMenuClick);
        document.addEventListener('click', () => menu.remove(), { once: true });
    });

    minimizeBtn?.addEventListener('click', () => {
        window.isMinimized = !window.isMinimized;
        if (window.isMinimized) {
            terminalContainer.classList.add('minimized');
            terminalIcon.classList.remove('hidden');
            terminalContainer.dataset.lastPosition = terminalContainer.style.transform;
        } else {
            terminalContainer.classList.remove('minimized');
            terminalIcon.classList.add('hidden');
            if (terminalContainer.dataset.lastPosition) {
                terminalContainer.style.transform = terminalContainer.dataset.lastPosition;
            }
            fitAddon.fit();
        }
    });

    terminalIcon?.addEventListener('click', () => {
        window.isMinimized = false;
        terminalContainer.classList.remove('minimized');
        terminalIcon.classList.add('hidden');
        fitAddon.fit();
    });

    closeBtn?.addEventListener('click', () => {
        terminalContainer.classList.add('hidden');
        localStorage.setItem('terminalHistory', JSON.stringify(window.terminalHistory));
    });

    const savedHistory = localStorage.getItem('terminalHistory');
    if (savedHistory) {
        window.terminalHistory = JSON.parse(savedHistory);
    }

    const titlebar = document.getElementById('terminal-titlebar');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    titlebar.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        if (e.target === titlebar) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            setTranslate(currentX, currentY, terminalContainer);
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }

    let commandHistory = [];
    let historyIndex = 0;
    let commandBuffer = '';

    term.onKey(({ key, domEvent }) => {
        const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;
        switch (domEvent.keyCode) {
            case 13:
                term.write('\r\n');
                if (commandBuffer.length > 0) {
                    commandHistory.push(commandBuffer);
                    historyIndex = commandHistory.length;
                    handleCommand(commandBuffer);
                    commandBuffer = '';
                }
                break;
            case 8:
                if (commandBuffer.length > 0) {
                    commandBuffer = commandBuffer.slice(0, -1);
                    term.write('\b \b');
                }
                break;
            case 38:
                if (historyIndex > 0) {
                    historyIndex--;
                    term.write('\r' + ' '.repeat(commandBuffer.length) + '\r');
                    commandBuffer = commandHistory[historyIndex];
                    term.write(commandBuffer);
                }
                break;
            case 40:
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    term.write('\r' + ' '.repeat(commandBuffer.length) + '\r');
                    commandBuffer = commandHistory[historyIndex];
                    term.write(commandBuffer);
                }
                break;
            default:
                if (printable) {
                    commandBuffer += key;
                    term.write(key);
                }
        }
    });

    const commands = {
        help: () => {
            term.writeln('\r\nAvailable commands:');
            term.writeln('  help     - Show this help message');
            term.writeln('  clear    - Clear the terminal');
            term.writeln('  ls       - List current directory');
            term.writeln('  cd       - Change directory');
            term.writeln('  pwd      - Print working directory');
            term.writeln('  echo     - Repeat a message');
            term.writeln('  inspect  - Inspect an artifact');
            term.write('\r\n> ');
        },
        clear: () => {
            term.clear();
            term.write('> ');
        },
        ls: () => {
            term.writeln('\r\nancient_artifacts/');
            term.writeln('├── key.eth');
            term.writeln('├── book_of_flowers.eth');
            term.writeln('├── lock.eth');
            term.writeln('├── wand.eth');
            term.writeln('└── crown.eth');
            term.write('\r\n> ');
        },
        pwd: () => {
            term.writeln('\r\n/root/ancient/swan');
            term.write('\r\n> ');
        },
        cd: (args) => {
            term.writeln(`\r\nNavigating to ${args[0] || '~'}`);
            term.write('\r\n> ');
        },
        echo: (args) => {
            term.writeln('\r\n' + args.join(' '));
            term.write('\r\n> ');
        },
        inspect: async (args) => {
            const response = await fetchAIResponse(`inspect ${args.join(' ')}`);
            term.writeln('\r\n' + response);
            term.write('\r\n> ');
        }
    };

    async function handleCommand(input) {
        const [cmd, ...args] = input.trim().split(' ');
        window.terminalHistory.commands.push(input);
        if (commands[cmd]) {
            await commands[cmd](args);
            if (cmd !== 'clear' && cmd !== 'echo') {
                const randomResponse = AI_PERSONALITY.responses.command_observed[
                    Math.floor(Math.random() * AI_PERSONALITY.responses.command_observed.length)
                ];
                term.writeln('\r\n' + randomResponse);
                term.write('\r\n> ');
            }
        } else {
            const response = await fetchAIResponse(input);
            window.terminalHistory.conversation.push({ input, response });
            term.writeln('\r\n' + response);
            term.write('\r\n> ');
        }
    }

    return { term, fitAddon, terminalContainer };
}

async function fetchAIResponse(message) {
    const systemPrompt = `
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
    `;
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemPrompt,
                message
            })
        });
        if (!response.ok) {
            const text = await response.text();
            console.error('Proxy error:', text);
            return "Error communicating with SWAN. The ancient circuits are disturbed...";
        }
        const data = await response.json();
        return data.content;
    } catch (error) {
        console.error('Error:', error);
        return "Error communicating with SWAN. The ancient circuits are disturbed...";
    }
}

export { initializeTerminal, terminalInstance };
