# Repository Guidelines

## Project Structure & Module Organization
- `web/`: Next.js app (App Router) for Swan Computer frontend.
- `legacy_vite/`: Archived Vite site (no longer used).
- `utils/`: Utility scripts (legacy helpers if needed).
- `nfts/`: Solidity contracts, tests, and Hardhat config.
- Root config: `.prettierrc`, `package.json` (monorepo meta only).

## Build, Test, and Development Commands
- Frontend (Next.js): `cd web && bun install && bun dev` (http://localhost:3000)
- Build frontend: `cd web && bun run build`; start: `bun start`
- Format: `bun run format` (Prettier across repo)
- Contracts: `cd nfts && npm install && npx hardhat compile && npx hardhat test`

## Coding Style & Naming Conventions
- Prettier: 4-space indent, semicolons, single quotes, 120-char line width, trailing commas (ES5).
- Filenames: kebab-case for CSS; camelCase for JS functions/variables.
- Next.js app structure in `web/app/*` (App Router).
- Env vars: `OPENROUTER_API_KEY` (server), `NEXT_PUBLIC_*` (client-safe) in `web`.

## Testing Guidelines
- Smart contracts: Mocha/Chai via Hardhat; tests live in `nfts/test/*.test.js`.
- Run: `cd nfts && npx hardhat test`. Add new tests beside existing ones; keep them deterministic.
- Frontend: no automated tests yet—validate via `cd web && bun dev` and `bun start`.

## Commit & Pull Request Guidelines
- Commits: imperative, concise, present tense. Example: "Add constructor validation and enhance SwanCollection tests".
- PRs: include description, linked issues, screenshots for UI changes, reproduction steps, and `npx hardhat test` output for contract changes.
- Quality gate: run `bun run format` and ensure no secrets in commits.

## Security & Configuration Tips
- Never commit `.env` or keys. Use `NEXT_PUBLIC_*` only for client-safe values; avoid exposing sensitive tokens.
- AI key lives server-side as `OPENROUTER_API_KEY` in Next API route.
