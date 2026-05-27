# pdk — Portaldot Dev Kit · DoraHacks Submission

> Ready-to-paste copy for the DoraHacks BUIDL description. Track: **Builder Tools for Portaldot**.

## One-liner

**pdk turns Portaldot's cryptic transaction failures into clear, actionable diagnoses — and gives every developer a one-command local dev loop.**

*A starter kit helps you **write** Portaldot code; pdk is the only tool that **saves** you when it breaks — decoding failed transactions into fixes that generic Substrate tooling can't.*

## The problem

Portaldot is a brand-new, Substrate-based, Rust-first chain. In Season 1 developers run it from a **local node** (the organizers' intended environment). The developer experience is rough: when a transaction fails, the node returns a raw error like `Module error: 0x0600…` with no explanation and no hint of how to fix it. Onboarding and debugging are the biggest sources of friction in the ecosystem — the hackathon's own Q&A is full of *"how do I get POT?"* and *"where's the RPC / faucet?"*, with builders blocked and waiting on unanswered replies. pdk is the answer to exactly those questions.

## The solution

`pdk` (Portaldot Dev Kit) is a single Python CLI that owns the local development loop:

- **`pdk up`** — start a local node and verify it with a real on-chain transaction.
- **`pdk accounts`** — show the pre-funded dev accounts and their POT balances. The one-command answer to the most-asked question in the Q&A: *"how do I get POT?"*
- **`pdk debug` (FailLens)** — decode a failed transaction into a plain-language diagnosis + fix. The hero feature.
- **`pdk debug --watch`** — a live monitor: every failure on the chain is decoded the moment it lands.
- **`pdk explain <error>`** — a queryable reference for every Portaldot error, no transaction needed.
- **`pdk explain --module 6 --error 2`** — decode the *raw* `DispatchError { Module: { index, error } }` code itself, with no tx hash and no name, against a verified 202-entry runtime index. This is the exact cryptic thing a node prints — and nothing else in the ecosystem decodes it.
- **`pdk doctor`** — node/runtime/ink! compatibility, plus a chain-liveness check that catches a stalled dev chain.
- **`pdk simulate`** — preview a transfer's POT fee and feasibility before sending it.
- **`pdk seed`** — fund accounts from YAML fixtures so you start from realistic state.
- **`pdk pallets`** — browse the runtime's pallets, calls, and errors straight from metadata.
- **`pdk send`** — submit a real POT transfer from a dev account.
- **`pdk storage`** — read any value from the chain's storage.
- **`pdk watch`** — stream all chain events live (optionally by pallet).
- **`pdk keys`** — generate or inspect a keypair (SS58 format 42).
- **`pdk report`** — scan recent blocks and summarise *every* decoded failure by type ("3 failed: 2× InsufficientBalance, 1× BadOrigin"). Triage for a flaky integration — failure analytics no other Portaldot tool offers.
- **`pdk debug --demo --fix`** — the debugger that *also remediates*: diagnose the failure, then submit the corrected transaction and show it succeed (diagnose → fix → success).
- **`pdk debug --ai` / `pdk explain --ai`** — an optional AI diagnosis for the long tail, *grounded in the chain's own metadata* (not a generic chatbot). Clearly labelled "AI-suggested"; the verified KB stays the source of truth.

We found these pains by *actually building* on Portaldot: `substrate-interface` would not connect (legacy `LookupSource`), our dev chain stalled on a BABE epoch error, and repeated submissions collided on the nonce. pdk handles all three so the next builder never has to.

**How FailLens works (and why it never goes stale):** a failed extrinsic emits a `System.ExtrinsicFailed` event carrying a `DispatchError`. FailLens resolves that error against the **chain's own metadata** — no hard-coded tables — so it adapts to any runtime version. Every error in the knowledge base is verified against the live `portaldot-1002` runtime (29 curated entries, 202 errors checked).

## Portaldot-native deployment (mandatory criterion)

`pdk up` and `pdk debug --demo` submit **real transactions to a local Portaldot node, paying POT as gas.** Native-deployment evidence (tx from a local dev node):

```
tx hash : 0x8b605579d6b512892f4394aa43937e1d762d34411b43c6a4aa9fa8a5dd4d546a
node    : local Portaldot dev node (portaldot_dev 2.0.0, chain "Development")
fee     : paid in POT by the submitting account
```

(Per the organizers' guidance, localhost is the intended Season-1 environment, and a tx hash from a local node is valid native-deployment proof.)

## Why it matters (application value)

**The market is the entire developer base of the chain — and growing it is the organizers' explicit goal.** A blockchain is worth what its builders ship on it; this hackathon exists to acquire developers. Onboarding and debugging friction is the single biggest reason a newcomer bounces off a brand-new, Rust-first chain with sparse tooling. pdk removes exactly that friction, so it is not a side tool — it sits on the critical path of the ecosystem's own growth metric. Every developer Portaldot wants to keep is a pdk user.

**Adoption path — built to spread, not to demo once:**

- **One-command install.** `pip install portaldot-pdk` — published to PyPI, no clone, no build. (Release pipeline is automated via tag → PyPI Trusted Publishing.)
- **A CI citizen, not just a REPL.** `pdk debug --json --exit-code` returns a non-zero code with a decoded diagnosis, so a Portaldot project can *gate its pipeline* on transaction failures (see [`docs/ci-recipe.md`](docs/ci-recipe.md)). That turns pdk from a personal convenience into team infrastructure.
- **A community-owned knowledge base.** FailLens reads fixes from `error_fixes.yaml`; every contributor who adds an entry improves debugging for the whole ecosystem. [`CONTRIBUTING.md`](CONTRIBUTING.md) makes that a five-line PR. The value compounds with adoption.
- **Machine-readable everywhere.** `--json` output is the integration surface for the editor extensions and bots on the roadmap.
- **Cross-platform.** pdk runs natively on Linux, macOS, **and Windows** (pure-Python CLI), so no developer is excluded by their OS — the error reference and key tools even work with no node at all.

**Who it serves, concretely:** the *newcomer* who can't get POT (`pdk accounts`), the *ink! contract dev* facing a raw module error (`pdk debug`), and the *team* running on-chain integration tests in CI (`pdk debug --json --exit-code`).

**Why it's defensible (a real moat).** pdk speaks Portaldot's *exact* runtime — legacy `LookupSource` types, contracts API v5 / ink! 3.x quirks — and its knowledge base is verified against the live `portaldot-1002` metadata. You cannot lift a generic Substrate tool and get this; the value is in Portaldot-specific, verified knowledge that deepens every release. We earned that knowledge by building on the chain and even diagnosing an upstream `substrate-interface` signing bug along the way.

## Quality

- Verified end-to-end against a live Portaldot node (every command).
- 29 automated tests (CI on Python 3.11 + 3.12); graceful handling of unreachable nodes, missing/invalid hashes, short-chain scans, successful txs, and repeated demo runs.
- Packaged for PyPI (sdist + wheel build clean); automated release pipeline.
- MIT licensed, open source, with a contributor guide.

## Links

- **Repo:** https://github.com/PugarHuda/portaldot-pdk
- **Install:** `pip install portaldot-pdk`
- **Landing page:** https://portaldot-pdk.vercel.app
- **Developer dashboard (visual):** https://portaldot-pdk.vercel.app/dashboard
- **Error reference (zero-install):** https://portaldot-pdk.vercel.app/errors
- **Pitch deck:** https://portaldot-pdk.vercel.app/slide
- **CI recipe:** [docs/ci-recipe.md](docs/ci-recipe.md)
- **Demo video:** <add link>

## Roadmap

A typed **TypeScript SDK on `@polkadot/api`** — to unlock the two capabilities blocked by an upstream Python limitation: `substrate-interface` mis-signs custom-pallet calls (Assets, Contracts) on Portaldot's V13 metadata, so **asset/token seeding** and **ink! contract deployment** need the JS stack. (Diagnosed firsthand; see [substrate-interface #9](https://github.com/polkascan/py-substrate-interface/issues/9).) Plus deeper CI and editor integrations.
