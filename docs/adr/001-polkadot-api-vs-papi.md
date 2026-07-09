# ADR 001 — Choose `@polkadot/api` for pdk-ts α.1 (not PAPI)

**Status:** accepted · 2026-07-08

## Context

pdk-ts needs a Substrate/Polkadot RPC + codec layer to fetch runtime
metadata, read storage, and (eventually) sign transactions. Two live
choices in the TypeScript ecosystem today:

- **`@polkadot/api`** — mature, most widely used, Apache-2.0. Ships
  with legacy `LookupSource` support that Portaldot's V13 metadata
  needs. Heavy install footprint (~180MB with deps).
- **PAPI (Polkadot-API)** — modern, light-client-first, better
  TypeScript typing, smaller bundle. Actively recommended by
  Polkadot ecosystem docs for new dApps. Less battle-tested against
  legacy metadata like V13.

## Decision

Ship α.1 → α.3 on `@polkadot/api`. Benchmark PAPI at α.6 with a
migration spike; adopt whichever performs better against Portaldot's
runtime.

## Why

- **Portaldot-1002 metadata is V13 with quirks** (legacy
  `LookupSource`, contracts API v5). `@polkadot/api`'s type-registry
  presets already handle these. PAPI's coverage of legacy metadata is
  not yet documented.
- **Alpha velocity beats install size.** Hackathon repo, solo
  maintainer, 2-day sprint targets. `@polkadot/api` is what the
  maintainer already knows. Learning PAPI + porting = week of
  overhead, not shipping.
- **Metadata-driven architecture makes the decision reversible.**
  See ADR-002. Nothing pdk-ts does binds to a specific SDK — a
  swap at α.6 is a compile-time refactor, not a data migration.
- **PAPI-first will be tested with a real workload before commitment.**
  α.6 spike will run identical `doctor`/`pallets`/`storage`/`explain`
  suites against PAPI and produce numbers.

## Alternatives considered

- **PAPI from the start** — deferred to α.6. Blocking scenario would
  be if @polkadot/api couldn't reach V13 signing at all, which is
  the same upstream bug we're routing *around* on the Python side
  (polkascan/py-substrate-interface#9). @polkadot/api handles it.
- **subxt (Rust) with Node bindings** — third-party bindings unmaintained;
  duplicate build toolchain for contributors.
- **Roll our own RPC layer** — never seriously considered; 3-6 months
  of work for a hackathon-scale project.

## Consequences

- Bundle size stays large (~190 MB installed). Doc'd in pdk-ts README.
- α.6 milestone MUST run the benchmark before beta.1 tags.
- If PAPI wins at α.6, alpha versions in npm carry the historical
  `@polkadot/api` dependency; users would migrate at 0.2.0.
