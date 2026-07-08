# Changelog

## 0.2.0-alpha.2 — 2026-07-09

Read-only surface expansion. All commands still safe to run against
public RPCs or local dev nodes — no signing yet (that's alpha.3).

### Added
- `pdk-ts pallets` — list all runtime pallets with call/event/error
  counts, or detail one pallet with its call and error names. Verified
  against Polkadot mainnet (61 pallets returned).
- `pdk-ts storage <pallet> <item> [keys...]` — read any storage value
  via `api.query`. Verified: `pdk-ts storage System Number
  --node wss://rpc.polkadot.io` returns the current block (~32M).
  Case-insensitive pallet + item lookup so `System.Number` and
  `system.number` both work.
- `pdk-ts keys [source]` — inspect or generate an SS58-42 keypair.
  Fully network-free. Accepts `//Alice`, bare `Alice`, or a mnemonic;
  generates a 12-word mnemonic if no source is given. Deterministic
  addresses match the well-known Alice/Bob/Charlie constants
  (unit-tested).
- 4 new vitest cases in `tests/keys.test.ts` locking the crypto
  pathway against the canonical Substrate dev addresses.

### Notes
- Windows/git-bash users passing `/Alice` (single slash) will see
  MSYS translate the path into `C:/Program Files/Git/Alice`. Use
  `//Alice` or bare `Alice` on that shell; PowerShell users are
  unaffected. Documented in README.

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
