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

### Added
- **`send`** — submit a REAL POT transfer (transferKeepAlive). The
  signing tier: pdk-ts signs on Portaldot's metadata. `<to>` is a //URI
  or SS58 address; `--from` defaults to //Alice; `--amount` in POT
  (exact 14-decimal BigInt). **Success is confirmed by a positive
  `system.ExtrinsicSuccess` event, never by the mere absence of a
  dispatchError** — because @polkadot/api can't decode Portaldot's
  result events on a FAILED block, "no dispatchError" would otherwise
  report a failed transfer as sent (verified: a drain-below-ED transfer
  left the balance untouched yet looked successful). When the outcome
  can't be confirmed, `send` reports `status: unconfirmed` and points at
  Python `pdk debug <hash>`, never a false success. Verified live: a
  valid transfer moves the exact amount and reports success; a failing
  one reports unconfirmed.
- **`simulate`** — preview a transfer's POT fee + feasibility without
  sending (read-only: `paymentInfo` + balance read, no submission).
  Mirrors Python `pdk simulate`, including the existential-deposit-aware
  prediction: a `transferKeepAlive` that would drain the sender below the
  ED is correctly predicted `Balances.KeepAlive`, not a false SUCCEED.
  `predictOutcome` + `potToPlancks` (exact 14-decimal BigInt) exported and
  unit-tested; verified live parity with Python across all boundaries.
- **`report`** — scan recent blocks and group every decoded failure by
  error type (read-only failure analytics). `--blocks N`, `--json`. The
  `{blocks_scanned, total_failures, by_error}` core shape matches Python
  `pdk report` exactly. NOTE: on Portaldot, @polkadot/api cannot decode
  the events in blocks that contain a failure (the same metadata/type
  limitation behind "Unable to map [u8; 32]"; Python's substrate-interface
  with its node-template preset does not hit this). Rather than silently
  under-count, `report` skips undecodable blocks and surfaces
  `blocks_undecodable` + a warning pointing at Python. Works fully on
  chains @polkadot/api decodes natively (verified clean against Polkadot).
- **`kb --verify --node <url>`** — walks a live node's runtime metadata
  and diffs it against the shipped offline error index, flagging
  mismatches (a code whose name changed — the fast path would return the
  wrong error), missing, and stale entries. Mirrors the Python
  `pdk kb --verify`; `--json` for CI, exit 1 on any drift. Verified live
  against `portaldot-1002`: 202/202 exact match, and drift correctly
  detected against a corrupted index. `diffIndex` + `buildLiveIndex`
  exported; `diffIndex` covered by `tests/kb.test.ts`.
- **`explain --name` resolves a bare error name** (no pallet), matching
  Python `lookup_fix`'s tier-2 name-only fallback. `explain --name
  InsufficientBalance` previously returned "no KB entry" on pdk-ts while
  Python matched it; `lookup()` now falls back to a case-insensitive
  name-only suffix match and recovers the real pallet.

### Security
- **Terminal-escape hardening** (`stripControlChars` in `core/errors.ts`):
  chain-sourced text (chain name, node/runtime version, pallet/error
  names, bare storage values) is stripped of raw ANSI/OSC control bytes
  before rendering. picocolors doesn't parse Rich-style `[tag]` markup,
  but it passes raw OSC 8 hyperlink escapes straight through — a
  malicious/misconfigured node could otherwise inject a clickable link
  into pdk-ts's own output. Mirrors Python's `decoder.strip_control_chars`.

### Added
- **`doctor` gains a liveness check** (default on, matching Python
  `pdk doctor`'s `--liveness/--no-liveness`): reads the chain head
  block number, waits ~7s, reads it again, and reports whether the
  chain actually advanced — not just whether the WS handshake
  answered. A node can be "reachable" while stalled (the same BABE
  epoch-change wedge Python's doctor documents a fix for); previously
  pdk-ts's doctor had no way to tell the two apart. `--no-liveness`
  skips the wait for a fast reachability-only probe. `DoctorReport`
  gains an optional `liveness` field; `renderText` exported and
  covered by `tests/doctor-liveness.test.ts`. Exit code 1 on a
  detected stall, same as an unreachable endpoint.

### Fixed
- **`accounts` POT balance decimals aligned to 14 (the project convention),
  fixing a 100x cross-CLI disagreement with Python `pdk`.** Portaldot POT
  uses 14 decimals, but the Portaldot chain spec does not actually declare
  token decimals (`system.properties.tokenDecimals` is null — verified
  against a live `portaldot-1002` node), so `registry.chainDecimals`
  returns @polkadot/api's *default* of 12 — not a value Portaldot chose.
  An interim fix that read `registry.chainDecimals` therefore picked up
  that misleading 12 and displayed every balance 100x too large versus
  Python. `formatBalance` now uses 14 unless the chain EXPLICITLY declares
  its own decimals via `system.properties` (which still honors a chain
  that sets them, e.g. Polkadot's 10). Verified live: pdk-ts and Python
  now show identical balances for the same account. `formatBalance` is
  exported and covered by `tests/accounts.test.ts`.
- Balance thousands-separator is now pinned to en-US, so output no
  longer varies with the runner's locale (`1.000.000` on de-DE).

### Earlier in this Unreleased cycle — polish + edge cases

- `DEBUG_POLKADOT_API=0` (and `=false`, `=""`, `=no`) now count as OFF.
  Previously any non-empty string tripped truthy → filter disabled →
  noise leaked into `--json` output. Shell-friendly boolean handling.
- `kb --missing --json` and `kb --list --json` now carry `schemaVersion: 1`
  like `kb --json` already does — three JSON output paths in one command
  had three different shapes.

### Added
- `humanizeChainError` recognizes JSON-RPC standard error codes:
  - `-32000` (or plain "rate limit") → suggests alternate endpoints
  - `-32601` (method not found) → hints the chain doesn't expose it
  - `-32603` (internal error) → clarifies endpoint reachable but the
    runtime blew up on the call
- `tests/chain.test.ts` — 5 cases locking `installConsoleFilter`
  idempotency + `DEBUG_POLKADOT_API` value interpretation.
- `tests/kb-env.test.ts` — 3 cases spawning subprocess to verify
  `PDK_KB_PATH` / `PDK_INDEX_PATH` fail-hard behavior (round-10 fix).
- `tests/errors.test.ts` — 4 new JSON-RPC humanize cases.
- `lib.ts` gets three JSDoc `@example` blocks (offline lookup, health
  probe, metadata walk) so IDE hover surfaces working snippets.
- `docs/examples/README.md` — index page so GitHub browsers see what's
  in the directory + "how to add an example" checklist.

## 0.2.0-alpha.4 — 2026-07-09

### Fixed
- **`accounts`, `pallets`, `storage`, `explain --live` now use the
  same `humanizeChainError`** the doctor path got in round 10. Users
  no longer see cryptic `@polkadot/api` messages on the read-only
  commands. Local duplicate `readableError` functions removed from
  each command file.
- `workflow_dispatch` dry-run of the publish workflow dropped
  `--provenance` — that flag needs an OIDC subject that a non-tag
  ref can't provide, so dry runs were failing where real publishes
  succeeded. Now the dry-run truly rehearses.
- Docker image `latest` tag no longer piggy-backs on GitHub's
  `is_default_branch` heuristic — pinned to `refs/heads/master`
  explicitly to survive default-branch swaps or repo renames.
- README support links moved from relative `../SECURITY.md` (broken
  inside npm view) to absolute GitHub URLs.

### Added
- **`tests/errors.test.ts`** — 16 cases locking `readableError` +
  `humanizeChainError` including a new `ETIMEDOUT` branch (OS-level
  network timeout, distinct from our own connect-timeout race).
- Consistency test extended with `indexDrift` + `indexMeta` cases.
- `pdk-ts diagnose` surfaces `driftDetected` + `driftReason` fields
  in `--json` and in the human view.
- `pdk-ts kb --json` gains `schemaVersion: 1` for future compat.
- Library re-exports `indexDrift`, `indexMeta`, `readableError`,
  `humanizeChainError`.
- Docker labels: `org.opencontainers.image.version` +
  `image.revision` — `docker inspect` now shows the real version.
- README hero: 4-line CLI + 5-line library snippet at the top.
- `pdk-ts examples` gains a "Programmatic (as a library)" group.

### Changed
- `files` field narrows `dist` to `**/*.js` + `**/*.d.ts` — sourcemaps
  no longer ship to npm. Package size dropped 42 kB → 35 kB, file
  count 64 → 36 (44%). Source paths from `F:\Hackathons\...` no
  longer leak into published tarballs.
- All CI workflows gained a `concurrency:` block. Rapid-fire pushes
  cancel the in-flight run instead of racing; docker.yml explicitly
  disables cancellation on tag builds (killing a mid-flight publish
  is worse than double-billing).
- `extract_index.py` runtime fingerprint is now robust to
  substrate-interface version drift: tries the `.runtime_version`
  attribute in every known shape (int / dict) before falling back
  to the raw RPC.

## 0.2.0-alpha.4 — 2026-07-09

### Fixed
- **Publish workflow was missing `id-token: write`**, so
  `npm publish --provenance` on a real `pdk-ts-v*` tag would have failed
  with "provenance requires id-token: write". Would have been discovered
  at first attempted release — added now.
- `PDK_KB_PATH` / `PDK_INDEX_PATH` env overrides now fail hard when the
  path doesn't exist, instead of silently falling back to the shipped
  default. Silent fallback hid user typos.
- Chain-connect error UX. `pdk-ts doctor --node <bad>` now appends an
  actionable hint to the raw `@polkadot/api` message:
  - non-101 → "not a WebSocket server"
  - ENOTFOUND → "DNS lookup failed"
  - ECONNREFUSED → "nothing accepted the connection"
  - our own timeout → "try --timeout <seconds>"
- `pdk-ts kb --json` now carries `driftDetected` + `driftReason` so
  machine consumers surface index/constant drift without parsing stderr.
- `installConsoleFilter` no longer leaks `PDK_TS_CONSOLE_FILTER_INSTALLED`
  into child processes; guard is a module-level flag.
- Unknown command UX. `pdk-ts badcmd` now suggests near-matches and
  points at `pdk-ts --help`.

### Added
- `src/core/errors.ts` — single source of truth for `readableError` +
  `humanizeChainError`. Doctor and CLI unhandled-rejection paths use it;
  local duplicates removed.
- `tests/config.test.ts` — 10 vitest cases locking `validateNodeUrl` +
  `resolveNode` behaviour (ws/wss, IPv6, case, path, error cases).
- `tests/explain-fastpath.test.ts` — 5 cases for offline index lookup
  including out-of-range + non-integer inputs.
- `docs/examples/basic-consumer` gets `flow1-only.ts` + `npm run flow1`
  for network-free offline demos (`npm start` needs a live RPC).

### Changed
- `engines.node` bumped `>=20` → `>=22`. CI matrix trimmed to node 22
  across all three OSes.
- Docker image build now emits multi-arch (`linux/amd64`, `linux/arm64`)
  on `pdk-ts-v*` tag pushes — Apple Silicon devs no longer need qemu.
- Docker smoke test verifies the `error_index.meta.json` sidecar
  actually copied into the image (guards `.dockerignore` regression).
- `docker.yml` runs on every PR touching pdk-ts or KB, not just
  Dockerfile changes.
- `basic-consumer` CI job dropped the redundant second `npm install`.
- `ci.yml` runs `python -m py_compile extract_index.py` so a PR that
  breaks the Python side of the sidecar generator fails fast.

### Docs
- README linked to `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`.
- `docs/alpha4-signing-design.md` renamed to `alpha5-signing-design.md`
  to match the roadmap shift.

## 0.2.0-alpha.4 — 2026-07-09

### Performance
- **Cold `import('portaldot-pdk-ts')` drops from ~2.8 s to ~430 ms**
  because `@polkadot/api` is now dynamically imported inside `getApi()`
  instead of at module-load. Offline-only consumers (`resolveByName`,
  `loadKb`) see the difference immediately.

### Fixed
- `console.log` / `.info` / `.warn` are no longer monkey-patched at
  library-import time. The stdout-noise filter now runs only from the
  CLI entry (`bin/index.ts`), so library consumers' own logging stays
  untouched. Exposed as `installConsoleFilter()` for CLI-mode explicit
  opt-in.

### Data
- `extract_index.py` now writes `pdk/data/error_index.meta.json`
  atomically with `error_index.json` — the two never drift silently.
- `entryCount` field removed from the sidecar (derivable, so noise).

### Docs
- README status bumped to alpha.4; alpha.4 highlights the library
  entry, roadmap shifted (signing → alpha.5).
- Badges added (npm@alpha, CI, Docker).
- `docs/releases/v0.2.0-alpha.4.md` — GH release body.
- `docs/releases/v0.2.0-alpha.3.md` moved to `archive/`.
- `basic-consumer/README.md` — added the "build pdk-ts first" step +
  local-verify command.

### Repo hygiene
- `.dockerignore` — trims context from 300 MB+ (remotion, screens,
  mp4s, docs artifacts) to just the sources + KB the image needs.
- `docker.yml` runs on ALL PRs that touch pdk-ts or KB (previously
  only Dockerfile changes triggered it).
- `docker.yml` smoke test now verifies `USER pdk` — regressing to
  root fails CI.
- `security.yml` SBOM gates on ≥30 components — silent green if the
  cyclonedx tool ever regresses is worse than red.
- `package-lock.json` pruned of `@acala-network/chopsticks` (dep was
  removed but the lockfile still carried 77 references).

## 0.2.0-alpha.4 — 2026-07-09

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
