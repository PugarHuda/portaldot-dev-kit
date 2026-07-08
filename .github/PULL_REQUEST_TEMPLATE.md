## What this PR does

Short summary. Link the issue this closes if there is one.

## Which side of the repo?

- [ ] `pdk/` (Python)
- [ ] `pdk-ts/` (TypeScript)
- [ ] `pdk/data/error_fixes.yaml` (shared KB — one PR benefits both)
- [ ] Docs / site / infra only

## How I verified

- [ ] Ran the affected CLI locally against a Portaldot / Substrate node
- [ ] `pytest tests/` green (Python) or `npm test` green (TS)
- [ ] No new `any` types on the TS side
- [ ] No hardcoded pallet indexes / error names (metadata-driven)

## Anything reviewers should double-check

Small nits, tradeoffs, follow-ups.
