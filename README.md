# Swan Computer

Treasure-hunt game powered by a mystical AI guide where players solve riddles to unlock digital art NFTs. Built to demo Web3 UX (wallets, daily blockchain usage, AI integrations, social sharing) beyond financial transactions.

Hackathon target: Base Sepolia (testnet).

Frontend (Next.js):
- Location: `web/`
- Env: set `OPENROUTER_API_KEY=...` (server-only)
- Run: `cd web && bun install && bun dev`

Contracts:
- Location: `nfts/`
- Run: `cd nfts && npm install && npx hardhat compile && npx hardhat test`

Notes:
- Vite site archived under `legacy_vite/` and no longer used.
- AI calls are proxied via Next route `web/app/api/chat/route.js`.
- Use Bun for scripts: `bun dev`, `bun run build`, `bun start`.
