# pdk — Demo Recording Script

A 2–4 minute demo for the hackathon submission. Record the whole flow without
cuts; re-record until smooth (the submission is a video, so this is allowed).

## Setup (before recording)

- Portaldot node running in WSL: `./portaldot_dev --dev --alice`
- pdk installed: `pip install -e .`
- Terminal font large enough to read on video.

## Scene 1 — The pain (~30s)

1. Show a failing transaction in the portaldot.io explorer or via a raw call.
2. Point at the raw error: `Module error: 0x05000000` — cryptic, no guidance.
   Say: "This is what every Portaldot developer sees when a transaction fails.
   No explanation, no hint."

## Scene 2 — pdk up (~30s)

1. Run `pdk up`.
2. Show: node starts, accounts funded, verification tx hash printed.
   Say: "pdk gets a local Portaldot environment running with one command."

## Scene 3 — FailLens, the hero (~90s)

1. Run `pdk debug --demo`.
2. Show the panel: `✗ Balances.InsufficientBalance` → "What happened" in plain
   language → "How to fix" numbered steps.
   Say: "FailLens reads the failed transaction, decodes the error against the
   chain's own metadata, and tells you exactly what went wrong and how to fix
   it."
3. Optional: run `pdk debug <a real failed tx hash>` to show it works on any
   transaction, not just the demo.

## Scene 4 — Close (~30s)

- Show `pdk doctor` briefly (node + ink! compatibility check).
- State the roadmap: pdk grows into the standard Portaldot dev toolkit.
- Show the GitHub repo URL and the native-deployment tx hash.

## Must appear on screen (judging requirements)

- A real transaction hash from the local Portaldot node (native deployment).
- POT being used as the transaction fee.
- A clear before/after: raw error vs. FailLens diagnosis.
