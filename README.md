# pdk — Portaldot Dev Kit

A developer toolkit for the [Portaldot](https://www.portaldot.io/) blockchain.
Built for the **Portaldot Online Mini Hackathon S1** — *Builder Tools* track.

## The problem

Portaldot is a brand-new, Substrate-based, Rust-first chain with no public
testnet — every developer runs a local node. The developer experience is
rough: when a transaction fails, the node returns a cryptic error
(`Module error: 0x0500…`) with no explanation and no hint of how to fix it.

## What pdk does

A single CLI that owns the local development loop:

| Command | What it does |
|---|---|
| `pdk up` | Start a local Portaldot node, fund dev accounts, run a verification tx |
| `pdk debug` | **FailLens** — decode a failed transaction into a plain-language diagnosis + fix |
| `pdk doctor` | Check node version, contracts API version, environment health |

**FailLens** is the hero feature. It reads the `System.ExtrinsicFailed` event
of a failed transaction, decodes the `DispatchError` against the chain's own
metadata, and pairs it with a curated fix knowledge base:

```
✗ Balances.InsufficientBalance   (5, 2)

What happened
You tried to transfer more POT than the sending account holds.

How to fix
  1. Check the sender balance via the explorer or `pdk doctor`.
  2. Lower the amount, or fund the account first (`pdk up` funds dev accounts).
```

## Install

```bash
pip install -e .
pdk --help
```

> The Portaldot node binary is Linux-only. On Windows, run pdk inside WSL.

## Native deployment proof

`pdk up` and `pdk debug --demo` submit real transactions to a local Portaldot
node, paying POT as gas. A sample transaction from a local node, recorded as
native-deployment evidence:

```
tx hash : 0x7b4877cba020d2ffdd4fea08c0be8107e66ae315f92326aa6ab23d3f278f1860
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
