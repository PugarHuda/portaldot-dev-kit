# ADR 002 — Metadata-driven decoder, no hardcoded pallet tables

**Status:** accepted · 2026-05-19 (Python `pdk`), 2026-07-08 (`pdk-ts`)

## Context

The FailLens decoder must resolve `DispatchError { Module { index,
error } }` into a named pallet.Error. Two approaches:

- **Hardcode a lookup table** in the source — `PALLETS = {6: "Balances",
  ...}` with all names inlined.
- **Read the chain's own runtime metadata** at every invocation —
  fetch pallets from `api.runtimeMetadata.asLatest.pallets`, walk the
  variant types, resolve the name dynamically.

## Decision

Metadata-driven everywhere. Zero hardcoded pallet indexes, zero
hardcoded error names, on either the Python or TypeScript side.

## Why

- **Runtime upgrades never break the decoder.** New pallets appear
  automatically. Renamed errors resolve automatically. Reindexed
  dispatch tables resolve automatically. The chain is the source of
  truth.
- **Portable across Substrate chains.** Same code works against
  Polkadot, Kusama, Rococo, Westend, any Substrate node — verified
  in CI against public Polkadot RPC.
- **Hardcoded tables age poorly.** They become "the maintenance
  reason" — every runtime bump requires a diff, a PR, a release.
- **The offline `error_index.json` fast path is orthogonal.** It's a
  pre-computed cache of a *specific runtime* (portaldot-1002), used
  when the user knows they're on that chain. When it misses, we fall
  back to the metadata walk. See `pdk-ts/src/commands/explain.ts`.

## Alternatives considered

- **Hybrid: hardcode Portaldot pallets, walk metadata for others** —
  rejected. Splits the codepath and doubles test surface.
- **Bundle a per-release metadata JSON** — this is what
  `error_index.json` does for the fast path, but it's a cache, not
  the source. Bundle stays optional.

## Consequences

- Fast path caveat: `pdk-ts explain --module N --error M` returns an
  index-based answer that's only correct for the runtime the index
  was extracted from. `--live` flag forces metadata walk; the index
  answer surfaces a `warning` when `--node` is set to a different
  chain.
- Extract-index script (`extract_index.py`) is Portaldot-specific;
  regenerate after every Portaldot runtime upgrade.
- Third-party Substrate chains work by default, no code changes needed.
