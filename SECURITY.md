# Security Policy

## Reporting a vulnerability

If you find a security issue in `pdk` (Python) or `pdk-ts` (TypeScript) —
especially anything that affects **signing paths**, key handling, or
private-key exposure — please **do not open a public GitHub issue**.

Instead, email the maintainer directly:

**hudapugar (at) gmail (dot) com** — subject line prefixed with
`[SECURITY]`.

You should get a first-response acknowledgement within 72 hours. If
you do not, please DM `@PortaldotDevKit` on X as a fallback.

## Scope

**In scope:**

- Any way an attacker can extract a signing key from either CLI
- Any way a malicious node can trick `pdk debug` / `pdk-ts doctor`
  into decoding to a wrong error name
- Any way the shared knowledge base (`pdk/data/error_fixes.yaml`) can
  be poisoned to yield misleading fix steps
- Anything in the release pipeline that could ship a compromised
  binary to PyPI or npm

**Out of scope:**

- Bugs in third-party dependencies unless they change our threat
  posture materially (use their upstream trackers)
- Anything that only affects `--dev` local nodes with no real value
  at risk
- Denial of service against your own local RPC endpoint

## What "signing" means in scope

`pdk` (Python) already ships signing via `substrate-interface`. `pdk-ts`
signing shipped in v0.2.0-alpha.5 (now at alpha.7, including Assets pallet
signing). Any vulnerability that:

- Sends a private key over the network
- Persists a private key to disk unencrypted
- Signs a transaction the user did not authorize
- Substitutes a different destination or amount silently

...is treated as **P0 / critical** and gets a same-day patch commitment
if reproducible.

## Disclosure timeline

- Day 0: Report received, acknowledged
- Day 0–2: Reproduction attempt + initial triage
- Day 2–7: Fix in a private branch (unless coordinated with upstream)
- Day 7–14: Public patch release + advisory
- Day 14+: CVE requested if the impact warrants it

## Coordinated releases

If the vulnerability affects both `pdk` and `pdk-ts` (e.g., a KB
poisoning vector), fixes ship simultaneously to PyPI and npm so no
single side lags behind.

## Bug bounty

There is no formal bug bounty program yet — this is a solo-maintained
open-source project. If your report leads to a real fix, you get
credit in the release notes and on the security advisory. If Portaldot
extends grant support to the project, a portion will be earmarked for
security disclosures.

## Public discussion

Once a fix is released and users have had a reasonable window to
upgrade (usually 14 days), the security advisory becomes public in the
repository's Security tab.
