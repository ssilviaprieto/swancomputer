# Swan Computer

Treasure-hunt game powered by a mystical AI guide where players solve riddles to unlock digital art NFTs. Built to demo Web3 UX (wallets, daily blockchain usage, AI integrations, social sharing) beyond financial transactions.

Hackathon target: Base Sepolia (testnet).

Frontend (Next.js):

- Location: `web/`
- Env: set `GROQ_API_KEY=...` (server-only) and `NEXT_PUBLIC_SWAN_COLLECTION_ADDRESS=...` for client-side config.
- Run: `cd web && bun install && bun dev`

Contracts:

- Location: `nfts/`
- Run: `cd nfts && npm install && npx hardhat compile && npx hardhat test`

Notes:

- Vite site archived under `legacy_vite/` and no longer used.
- AI calls are proxied via Next route `web/app/api/chat/route.js`.
- Use Bun for scripts: `bun dev`, `bun run build`, `bun start`.

## Deploying to Vercel

This repo is configured to deploy the Next.js app in `web/` via a root `vercel.json`.

- Config: see `vercel.json` at repo root. It uses the Next.js builder (`@vercel/next`) with `web/` as the source and routes all requests to `web`.
- Install/Build: Vercel will run `bun install`/`bun run build` if Bun is available, otherwise fallback to `npm install`/`npm run build`.
- Environment variables (set in Vercel Project → Settings → Environment Variables):
  - `GROQ_API_KEY` (required, server-only for the AI proxy)
  - `NEXT_PUBLIC_SWAN_COLLECTION_ADDRESS` (required, client-safe)

Local env files are ignored. Use `web/.env.example` as a template and do not commit secrets.
