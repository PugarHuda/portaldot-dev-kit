# pdk-ts — TypeScript companion for pdk

Status: **v0.2.0-alpha.1** (scaffolding phase — API surface expanding weekly).

pdk-ts is the TypeScript companion CLI to the Python
[`portaldot-pdk`](https://pypi.org/project/portaldot-pdk/). It exists to
cover the parts of Portaldot's runtime that Python `substrate-interface`
cannot sign on V13 metadata — Assets pallet operations, ink! contract
deploy, and any custom-pallet that ships with the chain going forward.

Same 14-command surface, Node-backed, same terminal UX.

## Roadmap

| Alpha | Scope |
|---|---|
| **alpha.1** (current) | `doctor` · `accounts` · `version` — read-only, real chain queries |
| alpha.2 | `pallets` · `storage` · `keys` |
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
pdk-ts doctor    Health probe against a Portaldot node
pdk-ts accounts  List pre-funded dev accounts + POT balance
pdk-ts version   Print CLI version
```

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
