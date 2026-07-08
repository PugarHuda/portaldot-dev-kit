# Getting help with pdk / pdk-ts

## First stop — the docs

- **Root README** — install + concept + full command reference for
  `pdk` (Python).
- **[`pdk-ts/README.md`](pdk-ts/README.md)** — install + roadmap for the
  TypeScript companion.
- **[`CONTRIBUTING.md`](CONTRIBUTING.md)** — how to add a fix to the
  shared error knowledge base.

## Something isn't working

Open a GitHub Issue with the [bug template](https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang/issues/new?template=bug_report.md).
The template captures the info a maintainer needs to reproduce fast:
CLI + version, exact command, expected vs actual, environment.

Turnaround target: **48 hours** to first response.

## I hit an error PDK doesn't decode yet

That's the community KB opportunity. Two paths:

1. **PR the fix directly** — 5-line YAML entry in `pdk/data/error_fixes.yaml`.
   Both `pdk` and `pdk-ts` pick it up automatically.
2. **Open a KB issue** — use the [KB entry template](https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang/issues/new?template=kb_entry.md).
   Tagged `good first issue` — maintainer will help you land the PR.

## Security disclosures

Do not open a public issue. See [`SECURITY.md`](SECURITY.md) — email
the maintainer directly at the address listed there. Response window
72 hours; P0 fixes shipped same-day if reproducible.

## Feature ideas

Open a GitHub Discussion or issue with the `enhancement` label. The
roadmap on the [partnership plan §2](docs/pdk-partnership-plan.md) is
the authoritative source for what's on deck; feature ideas outside
that scope get triaged after each alpha ship.

## Real-time chat

- **X / Twitter** — [@PortaldotDevKit](https://twitter.com/PortaldotDevKit)
  for product updates and DM for quick questions
- **Portaldot Discord** — the official `#dev-support` channel is the
  best place to reach Portaldot builders. A dedicated `#pdk` channel is
  in discussion with the Portaldot team.

## What isn't in scope

- General Substrate / Polkadot / Rust questions — try the
  [Substrate Stack Exchange](https://substrate.stackexchange.com).
- Portaldot chain issues that are not PDK-specific — the Portaldot
  team handles those directly. PDK is a client of the chain, not the
  chain itself.
