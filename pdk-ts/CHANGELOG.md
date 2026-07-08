# Changelog

## 0.2.0-alpha.1 — 2026-07-08

Initial scaffold of the TypeScript companion SDK.

### Added
- CLI entry point (`src/index.ts`) wired to commander
- `pdk-ts doctor` — real health probe against any Substrate/Portaldot
  WebSocket endpoint (endpoint · chain · node · runtime · pallet count ·
  contracts pallet presence)
- `pdk-ts accounts` — enumerate `//Alice`, `//Bob`, `//Charlie` dev
  accounts with live POT balances (12-decimal formatting)
- `pdk-ts version` — print current alpha version + status line
- Lazy `ApiPromise` factory (`src/core/chain.ts`)
- Config resolution: CLI flag > env var > default (`src/core/config.ts`)
- Vitest test suite (config-resolution unit tests only for now)
- TypeScript strict-mode config (`tsconfig.json` + build variant)

### Notes
- No signing yet — signing lands in alpha.3 alongside `send`/`seed`.
- Uses `@polkadot/api` for the alpha; PAPI migration benchmarked at alpha.5.
- Metadata-driven design mirrors the Python core, no hardcoded pallet
  or error tables.
