# ADR 003 — Shared YAML KB across Python + TypeScript

**Status:** accepted · 2026-07-08

## Context

Both `pdk` (Python) and `pdk-ts` (TypeScript) need access to the
curated "what happened / how to fix" content for named errors. Options:

- **Two separate files**, one per language, each maintained
  independently.
- **One shared file** in a common format (YAML) that both CLIs parse.
- **A database / API** — network-fetched, versioned server-side.

## Decision

Single shared file at `pdk/data/error_fixes.yaml`. Python's `pyyaml`
and TypeScript's `yaml` package both consume it directly.

## Why

- **One community PR benefits both CLIs immediately.** Contribution
  friction is halved. A five-line YAML PR lands in Python and
  TypeScript in the same commit.
- **YAML is the smallest possible contribution artifact.**
  Non-developers can PR. Non-Substrate developers can PR. The
  schema (documented in the file header) needs zero programming
  knowledge to follow.
- **No network dependency at runtime.** Both CLIs work offline for KB
  lookups. Availability is not a service; it's a git checkout.
- **Versioned with the runtime index.** Schema versioning (v1) is
  documented in the file header; breaking changes bump the version
  in a dedicated commit.

## Alternatives considered

- **Separate files per language** — rejected. Doubles maintenance
  cost and introduces drift risk (a fix landing in Python but not TS,
  or vice versa).
- **Networked KB (fetched at runtime)** — rejected. Adds a runtime
  dependency, availability risk, and privacy considerations. Also
  makes offline dev harder.
- **JSON instead of YAML** — YAML wins on human readability for
  multi-line summary/steps fields. JSON would need escaping for the
  common punctuation.

## Consequences

- Both CLIs must accept the same key convention
  (`<pallet_lowercased>.<ErrorName>`), documented in the KB header.
- Schema changes are semver-versioned; downstream users pin to a
  schema version, not a KB size.
- Long-tail errors without a KB entry fall back to the metadata doc
  comment (Python) or return `kbEntry: false` in the JSON output (TS).
