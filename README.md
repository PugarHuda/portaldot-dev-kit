# pdk — Portaldot Dev Kit

[![tests](https://github.com/PugarHuda/portaldot-pdk/actions/workflows/ci.yml/badge.svg)](https://github.com/PugarHuda/portaldot-pdk/actions/workflows/ci.yml)
![python](https://img.shields.io/badge/python-3.11%2B-blue)
![license](https://img.shields.io/badge/license-MIT-green)

A developer toolkit for the [Portaldot](https://www.portaldot.io/) blockchain.
Built for the **Portaldot Online Mini Hackathon S1** — *Builder Tools* track.

**[▶ Live page](https://portaldot-pdk.vercel.app)** · [Pitch deck](https://portaldot-pdk.vercel.app/slide) · [Submission](SUBMISSION.md) · [Demo script](DEMO.md) · [Video narration](VIDEO_SCRIPT.md)

![pdk — FailLens decoding a Portaldot transaction failure, live](docs/demo.gif)

*Real recording of pdk running against a live Portaldot node. Full **narrated pitch video** (slides + demo, voiced, subtitled): [`docs/pitch.mp4`](docs/pitch.mp4) — also [demo MP4](docs/demo.mp4).*

<!-- Demo GIF: record per docs/RECORD_GIF.md, then add here: ![pdk demo](docs/demo.gif) -->

---

## The problem

Portaldot is a brand-new, Substrate-based, Rust-first chain with **no public
testnet** — every developer runs a local node. The developer experience is
rough:

- When a transaction fails, the node returns a raw error like
  `Module error: 0x0600…` — no message, no explanation, no fix.
- Newcomers don't know how to get POT or where to start (the hackathon Q&A is
  full of *"how do I get POT?"* and *"where's the RPC / faucet?"*).

`pdk` is the answer to both: it turns cryptic failures into clear diagnoses, and
gives every developer a one-command local dev loop.

## Concept — how FailLens works

`pdk debug` (**FailLens**) is the hero feature. The decode is **metadata-driven**,
so it adapts to any runtime version and never goes stale:

```
failed tx ──▶ System.ExtrinsicFailed event ──▶ DispatchError
          ──▶ resolve against the chain's own metadata  ──▶ error name + docs
          ──▶ match a curated, verified fix knowledge base (3-tier lookup)
          ──▶ plain-language diagnosis + numbered fix
```

The knowledge base (`pdk/data/error_fixes.yaml`) has 29 curated entries, every
name **verified against the live `portaldot-1002` runtime** (202 errors checked).
Unknown errors fall back to the metadata doc comment, so FailLens is useful for
the long tail too.

## Commands

| Command | What it does |
|---|---|
| `pdk up` | Start a local Portaldot node, show funded dev accounts, verify with a real tx |
| `pdk accounts` | Show the pre-funded dev accounts and their POT balances — *"how do I get POT?"* |
| `pdk debug <hash>` | **FailLens** — decode a failed transaction into a plain-language diagnosis + fix |
| `pdk debug --demo` | Submit a real failing transaction, then decode it |
| `pdk debug --watch` | Live monitor — decode every failed transaction as it lands |
| `pdk debug --json` | Machine-readable output for CI / scripts |
| `pdk explain <error>` | Look up what any Portaldot error means and how to fix it — no tx needed |
| `pdk doctor` | Node version, runtime, ink!/contracts compatibility, and chain-liveness check |
| `pdk simulate` | Preview a transfer's POT fee and feasibility — *without* sending it |
| `pdk seed` | Fund accounts from YAML fixtures so you start from realistic state |
| `pdk pallets` | Browse the runtime's pallets, calls, and errors (from metadata) |
| `pdk send` | Send POT from a dev account — a real on-chain transfer |
| `pdk storage` | Read any value from the chain's storage |
| `pdk watch` | Stream all chain events live (optionally filtered by pallet) |
| `pdk keys` | Generate or inspect a keypair (SS58 format 42) |

> **No mocks, no fakes** — every command talks to a live Portaldot node.
> `pdk debug --demo` submits a *real* failing transaction (it is not simulated).

## Setup

Requires **Python 3.11+**. The Portaldot node binary is **Linux-only**, so on
Windows run everything inside **WSL**.

**1. Get and run a local Portaldot node** (inside WSL):

```bash
wget https://github.com/portaldotVolunteer/Portaldot-node/raw/main/portaldot-testnet-ubuntu.tar.gz
tar -xzf portaldot-testnet-ubuntu.tar.gz
cd portaldot-testnet-ubuntu
chmod +x portaldot_dev
./portaldot_dev --dev --alice --ws-external --rpc-cors all
```

The node listens on `ws://127.0.0.1:9944`. Leave it running.

> If the chain ever stops producing blocks (a dev DB can wedge with
> *"Unexpected epoch change"*), reset it: `./portaldot_dev purge-chain --dev -y`
> then start again. `pdk doctor` detects this for you.

**2. Install pdk:**

```bash
git clone https://github.com/PugarHuda/portaldot-pdk
cd portaldot-pdk
pip install -e .
pdk --help
```

## Usage

```bash
# 1. Bring the environment up (or just confirm your funded accounts)
pdk up
pdk accounts                      # Alice / Bob / Charlie + their POT balances

# 2. Debug failures
pdk debug --demo                  # submit a failing tx, then decode it
pdk debug 0x<txhash>              # decode a specific failed transaction
pdk debug --watch                 # live: decode failures as they happen
pdk debug --demo --json           # machine-readable output

# 3. Understand & inspect
pdk explain InsufficientBalance   # error reference, no transaction needed
pdk explain                       # list every error pdk knows
pdk pallets                       # browse the runtime's pallets / calls / errors
pdk doctor                        # node + ink! compatibility + chain liveness

# 4. Preview & seed
pdk simulate --amount 10          # preview a transfer's fee + feasibility (no send)
pdk seed                          # fund dev accounts from fixtures

# 5. Transact & inspect
pdk send //Bob --amount 5         # a real POT transfer
pdk storage Balances TotalIssuance  # read any chain storage value
pdk watch --pallet Balances       # live stream of chain events
pdk keys                          # generate a new keypair
```

Example — `pdk debug --demo`:

```
✗ Balances.InsufficientBalance

What happened
You tried to transfer more POT than the sending account holds.

How to fix
  1. Check the sender balance via the explorer or `pdk doctor`.
  2. Lower the amount, or fund the account first.
```

## Architecture

```
pdk/
  cli.py            typer app; registers up / accounts / debug / explain / doctor
  config.py         static defaults (node URL, scan depth, binary name)
  commands/         one thin module per command (parse args → call core → render)
  core/
    chain.py        connect(), trigger_demo_failure(), dev_account_balances()
    decoder.py      decode_receipt(), find_receipt(), failed_receipts_in_block()
    knowledge.py    load_knowledge(), lookup_fix()  (3-tier resolution)
  data/
    error_fixes.yaml  the verified fix knowledge base
```

Command modules stay thin; all chain logic lives in `core/`. Connections use the
`substrate-node-template` type preset, required for Portaldot's legacy
`LookupSource` type.

## Native deployment proof

`pdk up` and `pdk debug --demo` submit **real transactions to a local Portaldot
node, paying POT as gas**. Sample evidence (tx from a local dev node):

```
tx hash : 0x8b605579d6b512892f4394aa43937e1d762d34411b43c6a4aa9fa8a5dd4d546a
node    : local Portaldot dev node (portaldot_dev 2.0.0, chain "Development")
fee     : paid in POT by the submitting account
```

Per the organizers' guidance, localhost is the intended Season-1 environment and
a tx hash from a local node is valid native-deployment proof.

## Testing

```bash
PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest tests/ -q
```

The env var avoids a clash with unrelated third-party pytest plugins in a polluted
global environment; a clean venv (or CI) does not need it. CI runs the suite on
every push (Python 3.11 and 3.12).

## License

MIT. All code is open source.

## Roadmap & known limitations

Two deferred capabilities — **asset/token seeding** and **ink! contract
deployment** — are blocked by the same upstream issue: `substrate-interface`
(pdk's Python backend) mis-signs *custom-pallet* calls (Assets, Contracts) on
Portaldot's **V13 metadata**, returning `Invalid Transaction: bad signature`.
Balances calls sign correctly, so `pdk send` / `seed` / `simulate` build on them.
(Confirmed across era and type-registry variations; see
[substrate-interface #9](https://github.com/polkascan/py-substrate-interface/issues/9).)

The clean unlock is a **typed TypeScript SDK on `@polkadot/api`**, which handles
V13 custom-pallet signing correctly — the natural next step for pdk, alongside
deeper CI and editor integrations.
