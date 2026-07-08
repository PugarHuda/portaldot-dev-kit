---
name: KB entry (new error fix)
about: Contribute a fix for a Portaldot error not yet in the knowledge base
title: '[kb] '
labels: kb, good first issue
---

**The error**
`<pallet>.<ErrorName>` — e.g. `balances.InsufficientBalance`

Runtime index (from `pdk explain --module N --error M` if you know them):
- `module`:
- `error`:

**What triggered it**
Which call/pallet interaction reproduces this error?

**What actually happened (plain English)**
Describe what the user was trying to do and why the chain rejected it.
Aim for 6th-grade reading level.

**How to fix (at least one step)**
1.
2.
3.

**Verified against**
- [ ] Portaldot local dev node
- [ ] Portaldot testnet
- [ ] Other Substrate chain (specify):

You can also just PR the entry directly against
`pdk/data/error_fixes.yaml` — that's the 5-line YAML PR route.
