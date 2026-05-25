# pdk — Demo Recording Script (~3 minutes)

Record the whole flow without cuts; re-record until smooth (the submission is a
video, so this is allowed). Two terminal panes side by side work best for the
live-monitor scene.

## ⚠️ Pre-flight (do this BEFORE recording)

A days-old dev chain DB can wedge ("Unexpected epoch change") and stop producing
blocks — which would freeze the demo. Start clean:

```bash
# inside WSL
cd ~/portaldot/portaldot-testnet-ubuntu
./portaldot_dev purge-chain --dev -y       # reset the dev chain
./portaldot_dev --dev --alice --ws-external --rpc-cors all   # leave running
```

Then confirm the chain is healthy — this is also a nice opening shot:

```bash
pdk doctor      # shows runtime + "✓ chain is producing blocks"
```

If doctor reports a stall, purge again before recording.

## Scene 1 — The pain (~25s)

Show a raw failed transaction (explorer or a raw call). Point at the cryptic
error. Say: *"This is what every Portaldot developer sees when a transaction
fails — a module error code, no explanation, no fix."*

## Scene 2 — `pdk up` (~25s)

```bash
pdk up
```

Show: node starts, verification tx hash printed. Say: *"One command takes you
from nothing to a running local node with a real on-chain transaction."*

## Scene 3 — FailLens, the hero (~45s)

```bash
pdk debug --demo
```

Show the panel: `✗ Balances.InsufficientBalance` → plain-language "What
happened" → numbered "How to fix". Say: *"FailLens reads the failed
transaction, decodes the error against the chain's own metadata, and tells you
exactly what went wrong and how to fix it."*

## Scene 4 — The wow: live monitor (~40s)

Left pane:
```bash
pdk debug --watch
```
Right pane (submit a couple of failing txs):
```bash
pdk debug --demo
pdk debug --demo
```
Show failures appearing decoded in the left pane in real time. Say: *"In watch
mode, FailLens becomes a live monitor — every failure on the chain is decoded
the moment it lands."*

## Scene 5 — Error reference (~20s)

```bash
pdk explain InsufficientBalance
pdk explain          # lists every error pdk knows
```

Say: *"Every error is a queryable reference — no transaction needed."*

## Scene 6 — Close (~25s)

```bash
pdk doctor
```
Show the ink!/contracts compatibility line and the liveness check. Mention the
roadmap (standard Portaldot dev toolkit), then show the GitHub repo and the
landing page URL.

## Must appear on screen (judging requirements)

- A real transaction hash from the local Portaldot node (native deployment).
- POT used as the transaction fee.
- A clear before/after: raw error vs. FailLens diagnosis.
