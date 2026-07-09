# Changelog

## 0.2.0-alpha.4 — 2026-07-09

Publishability + library-consumer pass. `pdk-ts` is now importable as a
library (`import { resolve, collectReport } from 'portaldot-pdk-ts'`),
not just a CLI. Ships to the `alpha` dist-tag on npm so `npm install
portaldot-pdk-ts` from a user won't pick up a prerelease as `latest`.

### Added
- **Library entry** (`src/lib.ts`) exposing the stable public API:
  `resolve`, `resolveByName`, `collectReport`, `diagnose`, `loadKb`,
  `loadIndex`, `lookup`, `indexLookup`, `indexSize`, `kbSize`, `kbPath`,
  `indexMatchesChain`, `getApi`, `closeApi`, `DEFAULT_NODE`, `VERSION`,
  `resolveNode`, `validateNodeUrl` + associated types. `main`/`types`/
  `exports` in package.json now point at `dist/lib.*`. Deep imports
  into `dist/commands/*` are blocked by the exports map on purpose.
- `pdk-ts accounts --all` — extend the default Alice/Bob/Charlie to
  include //Dave, //Eve, //Ferdie (the full canonical dev-account set).
- `error_index.meta.json` sidecar — carries `specName`/`specVersion`/
  `extractedAt` next to the JSON. `loadIndex()` cross-checks against
  the compiled-in constants and warns on drift.
- Git-bash path-mangling detector on `keys` — when `/Alice` is
  translated to `C:/Program Files/Git/Alice`, the error surfaces a hint
  pointing at `//Alice`, bare `Alice`, or `MSYS_NO_PATHCONV=1`.
- Consumer example (`docs/examples/basic-consumer`) now typechecks in
  CI against the freshly built pdk-ts.
- 3 new vitest cases (`consistency`, `version`) covering
  `indexMatchesChain` drift + library public surface.

### Fixed
- `unhandledRejection` / `uncaughtException` handlers on the CLI so
  async errors from `@polkadot/api` past the command handler print a
  readable message instead of a raw Node stack trace.
- Malformed KB entries (missing `summary` or empty `steps`) are now
  rejected at load time. Silent shipping of empty diagnoses is
  worse than no diagnosis. Set `PDK_DEBUG_KB=1` to log rejections.
- `getApi()` default connect timeout tightened 15 s → 10 s. Real WS
  handshakes complete in under a second even cross-continent.

### Changed
- Docker image runs as non-root (`USER pdk`).
- `publishConfig.tag = "alpha"` + workflow now derives dist-tag from
  the version string, so prereleases never land on `latest`.
- `.gitattributes` normalises text to LF, silences the CRLF warnings
  Windows contributors get on every commit.

### Removed
- `@acala-network/chopsticks` devDep — dead weight, no test used it.

## [Unreleased]

Hardening + discoverability pass. No new command surface breaks; safe
to consume today from a git install.

### Added
- `pdk-ts kb` — knowledge-base introspection. Default view shows KB
  coverage (`kbSize / indexSize`), `--missing` lists the 173 uncurated
  errors as a community-contribution shortlist, `--list` dumps every
  curated entry. `--json` on any mode.
- `pdk-ts diagnose` — single-command tool health check: version, node
  version, KB path + count, index fingerprint + count, and a
  connectivity probe. `--skip-connect` for offline mode.
- `pdk-ts examples` — curated groups of ready-to-copy invocations.
- First-run tip: bare `pdk-ts` invocation now surfaces `examples`.
- `DiagnoseReport` type exported from `commands/diagnose.ts` for
  programmatic consumers.
- Consistency test guarding KB ⊆ offline index (case-insensitive).
  Silent KB↔index drift would give users a wrong error name — this is
  the canary.

### Fixed
- Node URL validation rejects non-`ws://`/`wss://` schemes with a
  human error before opening a socket (previously produced a cryptic
  `[object ErrorEvent]`).
- `SIGINT`/`SIGTERM` now close the `ApiPromise` before exit so Ctrl+C
  never leaves a hanging WebSocket.
- Concurrent `getApi()` calls now share one connection promise instead
  of racing to open several sockets against the same URL.

### CI
- `.github/workflows/docker.yml` — builds the multi-stage Dockerfile,
  smoke-tests `version`/`kb`/`explain` inside the image, pushes to
  GHCR on `pdk-ts-v*` tags.
- `.github/workflows/security.yml` — Gitleaks secret scan + CycloneDX
  SBOM on every push, plus a weekly cron for upstream disclosures.

## 0.2.0-alpha.3 — 2026-07-09

Strategic pivot from the original roadmap: instead of gating on the
signing tier (`send`/`seed`) we shipped the **hero feature** — `explain`
— in this alpha. `explain` is read-only, needs no signing, and is the
unique thing PDK does that no other Substrate tool does. That means
7 of the 14 commands are now on the TS side, and both the "raw-code
decoder" claim and the "shared KB" claim have working proof-of-life
on the JavaScript ecosystem.

### Added
- `pdk-ts explain --module N --error M` — walks runtime metadata to
  resolve a raw `Module { index, error }` code into a named pallet
  error, then attaches the KB's summary + fix steps.
- `pdk-ts explain --name <pallet>.<Error>` — KB-only lookup, needs no
  node. Fully offline / network-free for known errors.
- `pdk-ts version --json` — machine-readable version output for
  scripting.
- 3 new vitest cases in `tests/explain.test.ts` covering the KB-only
  path against the canonical `balances.InsufficientBalance` entry.

### Fixed
- Silenced `@polkadot/api` verbose stdout logging (RPC-CORE, API/INIT,
  REGISTRY) so `--json` output is pure JSON. Consumers can `| jq`
  without preprocessing. Opt back in with `DEBUG_POLKADOT_API=1`.

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
