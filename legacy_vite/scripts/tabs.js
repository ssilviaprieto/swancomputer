document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const terminalContainer = document.getElementById('terminal-container');
    let terminalInstance;

    // Wait for terminalInstance to be available from swancomputer.js
    const waitForTerminal = setInterval(() => {
        if (window.terminalInstance) {
            terminalInstance = window.terminalInstance;
            clearInterval(waitForTerminal);
            console.log("Terminal instance loaded in tabs.js");
        }
    }, 100);

    // Hide all tabs initially
    tabContents.forEach(tab => tab.classList.remove('active'));

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const tabId = item.getAttribute('data-tab');

            // Remove active class from all items and hide all tabs
            menuItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(t => {
                t.style.display = 'none';
                t.classList.remove('active');
            });

            // Add active class to clicked item
            item.classList.add('active');

            if (tabId === 'terminal') { // PLAY button
                e.preventDefault();
                if (terminalInstance) {
                    const { term, fitAddon, terminalContainer } = terminalInstance;
                    terminalContainer.classList.remove('hidden');
                    terminalContainer.style.display = 'flex';
                    terminalContainer.style.zIndex = '1000';
                    console.log("Terminal opened via PLAY button");
                    fitAddon.fit();
                    term.focus();
                } else {
                    console.error("Terminal instance not available yet");
                }
            } else { // Other tabs (WHITEPAPER, HINTS, RULES)
                const targetTab = document.getElementById(tabId);
                if (targetTab) {
                    targetTab.style.display = 'block';
                    targetTab.classList.add('active');
                }
                if (terminalContainer) {
                    terminalContainer.classList.add('hidden');
                }
            }
        });
    });

    // Set initial active tab if needed
    const initialActiveMenu = document.querySelector('.menu-item.active');
    if (initialActiveMenu) {
        const initialTabId = initialActiveMenu.getAttribute('data-tab');
        const initialTab = document.getElementById(initialTabId); // Fixed typo: initialTab361Id -> initialTabId
        if (initialTab && initialTabId !== 'terminal') {
            initialTab.classList.add('active');
            initialTab.style.display = 'block';
        }
    }
});