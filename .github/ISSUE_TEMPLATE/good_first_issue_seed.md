---
name: 'Good first issue seed: contribute a knowledge-base entry'
about: Template for the initial community-onboarding issue
title: 'Community: curate 5 KB entries for the most common Portaldot errors'
labels: 'good first issue, help wanted, knowledge-base'
assignees: ''
---

## Context

`pdk-ts explain` and `pdk debug` both read fix suggestions from a shared
YAML file at `pdk/data/error_fixes.yaml`. Today it covers **29 of the 202
runtime errors** (14.4%). Every missing entry is a chance for someone hitting
that error to see a helpful diagnosis instead of just an opaque
`Pallet.Error` name.

Run this to see the shortlist:

```bash
cd pdk-ts && node dist/index.js kb --missing | head -30
```

## What we need

Pick 5 entries from the list. For each, add a YAML block to
`pdk/data/error_fixes.yaml`:

```yaml
- key: assets.BalanceLow
  summary: |
    You tried to move more of the asset than the account holds.
  steps:
    - Check the source account balance with `pdk-ts storage Assets Account <asset-id> <address>`
    - Confirm the amount respects the asset's decimals
    - If this is a testnet, mint or teleport more of the asset first
```

Rules:
- `key` is `<pallet>.<Error>` — the exact name from the index (case
  preserved, matches metadata).
- `summary` is one plain-English sentence — no jargon.
- `steps` are 2-4 concrete actions with copy-pastable commands when possible.

## Verifying your entry

```bash
cd pdk-ts && npm test           # consistency test locks KB ⊆ index
node dist/index.js explain --name assets.BalanceLow
```

## Attribution

Add yourself to `CONTRIBUTORS.md`. Every PR that ships a KB entry counts,
however small.
