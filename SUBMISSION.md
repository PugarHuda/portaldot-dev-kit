# pdk — Portaldot Dev Kit · DoraHacks Submission

> Ready-to-paste copy for the DoraHacks BUIDL description. Track: **Builder Tools for Portaldot**.

## One-liner

**pdk turns Portaldot's cryptic transaction failures into clear, actionable diagnoses — and gives every developer a one-command local dev loop.**

## The problem

Portaldot is a brand-new, Substrate-based, Rust-first chain with **no public testnet** — every developer runs a local node. The developer experience is rough: when a transaction fails, the node returns a raw error like `Module error: 0x0600…` with no explanation and no hint of how to fix it. Onboarding and debugging are the biggest sources of friction in the ecosystem — the hackathon's own Q&A is full of *"how do I get POT?"* and *"where's the RPC / faucet?"*, with builders blocked and waiting on unanswered replies. pdk is the answer to exactly those questions.

## The solution

`pdk` (Portaldot Dev Kit) is a single Python CLI that owns the local development loop:

- **`pdk up`** — start a local node and verify it with a real on-chain transaction.
- **`pdk accounts`** — show the pre-funded dev accounts and their POT balances. The one-command answer to the most-asked question in the Q&A: *"how do I get POT?"*
- **`pdk debug` (FailLens)** — decode a failed transaction into a plain-language diagnosis + fix. The hero feature.
- **`pdk debug --watch`** — a live monitor: every failure on the chain is decoded the moment it lands.
- **`pdk explain <error>`** — a queryable reference for every Portaldot error, no transaction needed.
- **`pdk doctor`** — node/runtime/ink! compatibility, plus a chain-liveness check that catches a stalled dev chain.
- **`pdk simulate`** — preview a transfer's POT fee and feasibility before sending it.
- **`pdk seed`** — fund accounts from YAML fixtures so you start from realistic state.
- **`pdk pallets`** — browse the runtime's pallets, calls, and errors straight from metadata.
- **`pdk send`** — submit a real POT transfer from a dev account.
- **`pdk storage`** — read any value from the chain's storage.
- **`pdk watch`** — stream all chain events live (optionally by pallet).
- **`pdk keys`** — generate or inspect a keypair (SS58 format 42).

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

The organizers' goal for this hackathon is developer acquisition. pdk attacks the single biggest barrier — getting started and debugging on a chain with no testnet — and is built to become **the standard Portaldot dev toolkit**. It is uncopyable from other chains: it speaks Portaldot's exact runtime (legacy `LookupSource` types, contracts API v5 / ink! 3.x quirks) and its knowledge base is verified against the real metadata.

## Quality

- Verified end-to-end against a live Portaldot node (every command).
- 17 automated tests; graceful handling of unreachable nodes, missing/invalid hashes, successful txs, and repeated demo runs.
- MIT licensed, open source.

## Links

- **Repo:** https://github.com/PugarHuda/portaldot-pdk
- **Landing page:** https://portaldot-pdk.vercel.app
- **Pitch deck:** https://portaldot-pdk.vercel.app/slide
- **Demo video:** <add link>

## Roadmap

A typed **TypeScript SDK on `@polkadot/api`** — to unlock the two capabilities blocked by an upstream Python limitation: `substrate-interface` mis-signs custom-pallet calls (Assets, Contracts) on Portaldot's V13 metadata, so **asset/token seeding** and **ink! contract deployment** need the JS stack. (Diagnosed firsthand; see [substrate-interface #9](https://github.com/polkascan/py-substrate-interface/issues/9).) Plus deeper CI and editor integrations.
