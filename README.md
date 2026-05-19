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
node, paying POT as gas. A sample transaction hash from a local node is
recorded here as native-deployment evidence:

```
TODO (task #10): <tx hash from local node>
```

## License

MIT — see project configuration. Core logic is open source.

## Roadmap

Beyond this hackathon, pdk grows into the standard Portaldot dev toolkit:
typed TypeScript SDK, state seeder, transaction simulator, CI integration.
