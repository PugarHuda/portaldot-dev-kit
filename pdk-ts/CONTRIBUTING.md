# Contributing to pdk-ts

pdk-ts is the TypeScript companion CLI to the Python
[`portaldot-pdk`](https://pypi.org/project/portaldot-pdk/). Both live in
the same repository and share the same knowledge base
(`pdk/data/error_fixes.yaml`).

## Ground rules

- **Read-only until alpha.3.** Do not add commands that sign or submit
  transactions before signing lands in alpha.3. Contributors should be
  able to `npm test` and `npm run dev` without ever moving POT.
- **Metadata-driven.** No hardcoded pallet lists, error tables, or
  chain-specific magic strings. Every fact comes from the runtime
  metadata or from the shared KB.
- **Small commits.** One command, one file, one commit — makes review
  and revert trivial.
- **No `any`.** Strict TypeScript throughout. If a `@polkadot/api`
  return type is too dynamic, narrow it with a runtime guard.

## Local setup

```bash
cd pdk-ts
npm install
npm run typecheck    # tsc --noEmit
npm run build        # emit ./dist
npm test             # vitest
npm run dev -- doctor --node ws://127.0.0.1:9944
```

You'll need Node.js 22 or later (see `.nvmrc`).

## Adding a new command

1. Create `src/commands/<name>.ts`. Export a `run(opts)` async function.
2. Register it in `src/index.ts` under the commander program.
3. Add at least one unit test in `tests/<name>.test.ts` — even if it
   only covers option parsing / config resolution. Integration tests
   against a live node come in a later phase.
4. Update `CHANGELOG.md` under the current alpha heading.
5. Update the roadmap table in `README.md` if your command belongs to
   a different alpha than the one listed.

## Adding a knowledge-base entry

The KB is Python-authored today at `pdk/data/error_fixes.yaml`. Add
your fix there — pdk-ts reads the same file via `src/core/kb.ts`, so
one PR covers both CLIs.

Format:

```yaml
- pallet_index: 6
  error_index: 2
  name: Balances.InsufficientBalance
  what_happened: You tried to transfer more POT than the account holds.
  how_to_fix:
    - Check the sender balance.
    - Lower the amount, or fund the account first.
```

## Style

- Prettier config lives in `.prettierrc`. Run `npx prettier --write .`
  before pushing.
- Editor settings are pinned via `.editorconfig` at the repo root.

## Reviews

- Alpha PRs need one maintainer approval.
- Beta and 0.2.0 PRs need two — including one Portaldot-side reviewer
  if we get one by then.
