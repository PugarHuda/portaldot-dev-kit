# pdk-ts — TypeScript companion for pdk

Status: **v0.2.0-alpha.2** (read-only surface expanding — signing next).

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

## Roadmap

| Alpha | Scope |
|---|---|
| alpha.1 | `doctor` · `accounts` · `version` — real chain queries |
| **alpha.2** (current) | `pallets` · `storage` · `keys` — full read-only surface |
| alpha.3 | `simulate` · `send` · `seed` — signing lands here |
| alpha.4 | `debug` · `explain` · `report` · `watch` · `ai-setup` |
| alpha.5 | PAPI migration spike + benchmark vs `@polkadot/api` |
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
pdk-ts version             Print CLI version
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
