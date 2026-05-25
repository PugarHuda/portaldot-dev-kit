# pdk — Portaldot Dev Kit

A developer toolkit for the [Portaldot](https://www.portaldot.io/) blockchain.
Built for the **Portaldot Online Mini Hackathon S1** — *Builder Tools* track.

**[▶ Live page](https://web-hudas-projects-a8e7f558.vercel.app)** · [Submission](SUBMISSION.md) · [Demo script](DEMO.md) · [Video narration](VIDEO_SCRIPT.md)

<!-- Demo GIF: record per docs/RECORD_GIF.md, then add here: ![pdk demo](docs/demo.gif) -->

## The problem

Portaldot is a brand-new, Substrate-based, Rust-first chain with no public
testnet — every developer runs a local node. The developer experience is
rough: when a transaction fails, the node returns a cryptic error
(`Module error: 0x0500…`) with no explanation and no hint of how to fix it.

## What pdk does

A single CLI that owns the local development loop:

| Command | What it does |
|---|---|
| `pdk up` | Start a local Portaldot node and verify it with a real transaction |
| `pdk accounts` | Show the pre-funded dev accounts and their POT balances — the answer to *"how do I get POT?"* |
| `pdk debug <hash>` | **FailLens** — decode a failed transaction into a plain-language diagnosis + fix |
| `pdk debug --watch` | Live monitor — decode every failed transaction as it lands, in real time |
| `pdk explain <error>` | Look up what any Portaldot error means and how to fix it — no transaction needed |
| `pdk doctor` | Check node version, runtime, and ink! / contracts-API compatibility |

Add `--json` to `pdk debug` for machine-readable output (CI / scripts).

**FailLens** is the hero feature. It reads the `System.ExtrinsicFailed` event
of a failed transaction, decodes the `DispatchError` against the chain's own
metadata, and pairs it with a curated fix knowledge base (every error name
verified against the live runtime):

```
✗ Balances.InsufficientBalance

What happened
You tried to transfer more POT than the sending account holds.

How to fix
  1. Check the sender balance via the explorer or `pdk doctor`.
  2. Lower the amount, or fund the account first.
```

## Install

```bash
pip install -e .
pdk --help

pdk up                       # start a local node + verify with a real tx
pdk accounts                 # show pre-funded dev accounts ("how do I get POT?")
pdk debug --demo             # submit a failing tx, then decode it
pdk debug --watch            # live: decode failures as they happen
pdk explain InsufficientBalance   # error reference, no tx needed
pdk doctor                   # node + ink! compatibility check
```

> The Portaldot node binary is Linux-only. On Windows, run pdk inside WSL.

## Native deployment proof

`pdk up` and `pdk debug --demo` submit real transactions to a local Portaldot
node, paying POT as gas. A sample transaction from a local node, recorded as
native-deployment evidence:

```
tx hash : 0x8b605579d6b512892f4394aa43937e1d762d34411b43c6a4aa9fa8a5dd4d546a
node    : local Portaldot dev node (portaldot_dev 2.0.0, chain "Development")
fee     : paid in POT by the submitting account
```

This transaction was submitted by `pdk debug --demo`. It is an intentional
failing transfer that FailLens then decodes; it was included on-chain with the
POT transaction fee paid — satisfying the native-deployment requirement.

## License

MIT — see project configuration. Core logic is open source.

## Roadmap

Beyond this hackathon, pdk grows into the standard Portaldot dev toolkit:
typed TypeScript SDK, state seeder, transaction simulator, CI integration.
