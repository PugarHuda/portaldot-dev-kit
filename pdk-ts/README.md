# pdk-ts — TypeScript companion for pdk

[![npm version](https://img.shields.io/npm/v/portaldot-pdk-ts?label=npm%20%40alpha&color=orange)](https://www.npmjs.com/package/portaldot-pdk-ts)
[![CI](https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang/actions/workflows/pdk-ts.yml/badge.svg)](https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang/actions/workflows/pdk-ts.yml)
[![Docker](https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang/actions/workflows/docker.yml/badge.svg)](https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang/actions/workflows/docker.yml)

Status: **v0.2.0-alpha.4** — 10 of 14 commands live (`doctor`, `accounts`, `pallets`, `storage`, `keys`, `explain`, `diagnose`, `examples`, `kb`, `version`) + library-importable public surface.

pdk-ts is the TypeScript companion CLI to the Python
[`portaldot-pdk`](https://pypi.org/project/portaldot-pdk/). It exists to
cover the parts of Portaldot's runtime that Python `substrate-interface`
cannot sign on V13 metadata — Assets pallet operations, ink! contract
deploy, and any custom-pallet that ships with the chain going forward.

Same 14-command surface, Node-backed, same terminal UX.

## Architecture

```
                   pdk/data/error_fixes.yaml
                    (shared KB — one PR = both CLIs)
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼───────┐          ┌────────▼────────┐
        │  pdk (Python) │          │  pdk-ts (TS)    │
        │  v0.1.6 · PyPI│          │  v0.2 alpha · npm-next│
        │               │          │                 │
        │ substrate-    │          │ @polkadot/api   │
        │ interface     │          │ (PAPI at α.5)   │
        └───────┬───────┘          └────────┬────────┘
                │                           │
                └───────────┬───────────────┘
                            ▼
                    Portaldot node
                (WebSocket · runtime metadata)
```

Both CLIs speak the chain via WebSocket + read the chain's runtime
metadata at every invocation — no hardcoded pallet or error tables on
either side. The shared YAML KB adds human-authored fix steps on top.

## Why v0.2 while Python pdk is still v0.1?

Version numbers here are **per-package**, not a global release. Python
pdk shipped stable at 0.1.6 during the hackathon. pdk-ts starts fresh
at 0.2 to signal that this whole track is the *v0.2 initiative* —
covering the parts of the runtime Python can't sign — and the first
`.0` release lands only when it reaches feature parity. Alpha.1 is
today's read-only slice; alpha.3 lights up signing.

## Support

- Bugs & feature requests → [issues](https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang/issues)
- Security disclosures → [`SECURITY.md`](../SECURITY.md)
- Support policy → [`SUPPORT.md`](../SUPPORT.md)
- Contribution guide → [`CONTRIBUTING.md`](../CONTRIBUTING.md)

## Roadmap

| Alpha | Scope |
|---|---|
| alpha.1 | `doctor` · `accounts` · `version` — real chain queries |
| alpha.2 | `pallets` · `storage` · `keys` — read-only surface |
| alpha.3 | `explain` — hero raw-code decoder (skipped ahead of signing) |
| **alpha.4** (current) | Library entry (`import { resolve, collectReport } from 'portaldot-pdk-ts'`), `diagnose`, `examples`, `kb` introspection, hardening pass |
| alpha.5 | `simulate` · `send` · `seed` — signing lands here |
| alpha.6 | `debug` · `report` · `watch` · `ai-setup` |
| alpha.6 | PAPI migration spike + benchmark vs `@polkadot/api` |
| beta.1  | Feature parity with Python `pdk` |
| 0.2.0   | Ship as `portaldot-pdk-ts` on npm |

## Install (local dev)

```bash
cd pdk-ts
npm install
npm run build
node dist/index.js doctor --node ws://127.0.0.1:9944
```

Or without building, in dev mode:

```bash
npm run dev -- doctor --node ws://127.0.0.1:9944
```

## Commands available today

```
pdk-ts doctor              Health probe against a Portaldot node
pdk-ts accounts            List pre-funded dev accounts + POT balance
pdk-ts pallets [name]      Browse runtime pallets (all, or detail one)
pdk-ts storage <p> <i> [k] Read any storage value from the runtime
pdk-ts keys [source]       Inspect (//Alice, mnemonic) or generate a keypair
pdk-ts explain --module N --error M   Decode a raw code → named error + fix
pdk-ts explain --name <pallet.error>  KB-only lookup (no node required)
pdk-ts version [--json]    Print CLI version
```

### Windows / git-bash note

Git Bash on Windows converts a single leading `/` in an argument to
a full Windows path (`/Alice` → `C:/Program Files/Git/Alice`). Two
workarounds:

- Use `//Alice` (double slash preserved) or bare `Alice` (pdk-ts
  auto-prepends `//`).
- Or set `MSYS_NO_PATHCONV=1` for the invocation.

PowerShell and Unix shells are unaffected.

Every chain-touching command accepts:

- `--node <ws-url>` — override the default `ws://127.0.0.1:9944`
- `--json` — emit machine-readable output for scripting

`PDK_TS_NODE` environment variable also works as a fallback.

## API — using pdk-ts as a library

Every command exports a `run()` entry plus a pure helper that returns
a structured report. Use the helpers to embed FailLens in your own
tools:

```ts
import {resolveByName, resolve} from 'portaldot-pdk-ts/dist/commands/explain.js';
import {collectReport} from 'portaldot-pdk-ts/dist/commands/doctor.js';
import {loadKb, lookup, indexLookup} from 'portaldot-pdk-ts/dist/core/kb.js';

// Offline KB lookup — no node needed
const named = resolveByName('balances.InsufficientBalance');
console.log(named?.summary, named?.steps);

// Offline index lookup — no node, no @polkadot/api load
const raw = indexLookup(6, 2);   // 'Balances.InsufficientBalance'

// Metadata walk — chain-agnostic, requires a live node
const live = await resolve('ws://127.0.0.1:9944', 6, 2);

// Health probe
const health = await collectReport('wss://rpc.polkadot.io');
```

A worked example lives at
[`docs/examples/basic-consumer/`](../docs/examples/basic-consumer/).

## Troubleshooting

**`pdk-ts doctor` hangs, then errors "could not connect within Xms"**
→ Node URL wrong, or the node is not accepting WebSocket. Verify with
`curl -i http://127.0.0.1:9944` — a WebSocket-only endpoint returns
400 for plain HTTP. Fix the URL scheme (`ws://` for local, `wss://`
for public), or increase `--timeout`.

**`pdk-ts keys /Alice` fails on git-bash (Windows)**
→ MSYS converts single-slash paths to Windows paths (`/Alice` →
`C:/Program Files/Git/Alice`). Use `//Alice` (double slash, preserved
by MSYS), bare `Alice` (pdk-ts auto-prepends `//`), or set
`MSYS_NO_PATHCONV=1` for the invocation.

**`pdk-ts` output shows verbose `@polkadot/api` log lines**
→ Filtering is on by default. If you set `DEBUG_POLKADOT_API=1`, the
logs come back. Unset the env var (`unset DEBUG_POLKADOT_API` in
bash) to re-silence.

**`pdk-ts explain --module N --error M` returns the wrong name**
→ Fast-path resolves against the Portaldot-1002 offline index. If
your node is a different chain (Kusama, Rococo, etc), pass `--live`
to walk metadata instead. When both `--node` and offline-index resolve
succeed, pdk-ts emits a warning field in the JSON output.

**"KB missing or empty" in `pdk-ts diagnose`**
→ pdk-ts couldn't find `pdk/data/error_fixes.yaml`. Ensure you're
running from a clone with the `pdk/` directory intact, or set
`PDK_KB_PATH` to your custom location.

## FAQ

**Q: Can I use pdk-ts against Polkadot / Kusama / any Substrate chain?**
A: Yes — pass `--node wss://<endpoint> --live` for full metadata
resolution. Only the offline fast path is Portaldot-specific.

**Q: When will pdk-ts publish to npm?**
A: 0.2.0 stable target — after α.4 (signing), α.5 (debug/report/watch),
and beta.1 (parity). At current velocity: ~2 weeks.

**Q: How is pdk-ts different from `@polkadot/api` or PAPI?**
A: pdk-ts is a **CLI** built on top of those libraries. See the
comparison table at the root README. Short version: PAPI/api are
libraries, pdk-ts is the 14-command dev-loop toolkit.

**Q: What about ink! contracts?**
A: pdk-ts uses native pallets (Balances etc). ink! contract deploy
lands in α.4 signing tier alongside `send`, `simulate`, `seed`.

## Bundle size

Installed `pdk-ts` (node_modules included) is roughly **190 MB** —
mostly `@polkadot/api` and its transitive dependencies for chain
encoding, metadata handling, and crypto. The compiled distributable
(`dist/`) is under **200 KB**; the size lives in the runtime
dependencies, not our code. Bundle-size optimisation is scoped for
α.6 alongside the PAPI migration spike, since PAPI's smaller
footprint is one of its main selling points.

## Design bets

**Metadata-driven, not hardcoded.** Same architecture as Python pdk:
we read the chain's own runtime metadata at every invocation, so error
names, pallet lists, and dispatch types never rot across runtime
upgrades.

**Composable core.** `src/core/chain.ts` is a single lazy `ApiPromise`
factory — commands request the API from it and never construct their
own connection. Same pattern the Python core uses.

**No transactional side-effects until alpha.3.** Alpha.1 and alpha.2
are strictly read-only so contributors can trust that `npm test` and
`npm run dev` will never move POT.

## Contributing

pdk-ts is developed alongside Python pdk in the same repo. If you have a
new Portaldot error to decode, PR it to `pdk/data/error_fixes.yaml` —
both CLIs read from the same knowledge base.

## License

MIT. Same as the parent repo.
