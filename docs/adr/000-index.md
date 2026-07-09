# Architecture Decision Records (ADRs)

Short design records for non-obvious choices. Each ADR captures the
context, the decision, and why alternatives were rejected. If a future
maintainer wants to know *why* the code looks the way it does, they
should be able to answer it from this directory in under 60 seconds.

Format follows the [Michael Nygard template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

## Index

- [001 — Choose `@polkadot/api` for pdk-ts α.1 (not PAPI)](001-polkadot-api-vs-papi.md)
- [002 — Metadata-driven decoder, no hardcoded pallet tables](002-metadata-driven-decoder.md)
- [003 — Shared YAML KB across Python + TypeScript](003-shared-yaml-kb.md)

## When to write an ADR

- Picking one library / framework over an obvious alternative
- Choosing a wire format, storage format, or protocol
- Making a governance / community process decision that binds future
  maintainers
- Rejecting a common pattern for a specific reason (would surprise a
  new contributor otherwise)

## When NOT to write an ADR

- Trivial refactors, renames, formatting
- Bug fixes (use commit messages)
- Feature adds that don't change architecture
- Docs / test additions
