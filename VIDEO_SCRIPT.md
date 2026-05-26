# pdk — Demo Video Narration (word-for-word, ~2:45)

English narration for an international audience. Pair with the scenes in
`DEMO.md`. Speak calmly; let each command's output land before talking over it.
Purge + restart the node first (see DEMO.md pre-flight).

---

**[0:00 — Title / hook]**
> "Portaldot is a brand-new Substrate chain — Rust-first. In Season 1, every developer runs a local node. And when something breaks, the chain doesn't help you."

**[0:12 — Scene 1: the pain]** *(show a raw failed transaction)*
> "Here's a failed transaction. This is all you get: a module error code. No message, no explanation, no idea how to fix it. You're on your own."

**[0:30 — Scene 2: pdk up]** *(run `pdk up`)*
> "Meet pdk — the Portaldot Dev Kit. One command brings up a local node and proves it works with a real on-chain transaction — paying POT as gas. There's your transaction hash."

**[0:52 — Scene 3: FailLens, the hero]** *(run `pdk debug --demo`)*
> "Now the core. `pdk debug` is FailLens. It takes that same failed transaction, reads the failure event, and decodes the error against the chain's own metadata. Watch."
> *(panel appears)*
> "Balances, Insufficient Balance. In plain English: you tried to send more POT than the account holds — and here's exactly how to fix it. The cryptic code is now a conversation."

**[1:25 — Scene 4: the wow — live monitor]** *(left pane `pdk debug --watch`, right pane submit failures)*
> "FailLens also runs live. In watch mode it monitors the chain, and the moment any transaction fails, it's decoded in real time — right here. For anyone building or testing on Portaldot, this is a window into what's actually going wrong."

**[1:55 — Scene 5: error reference]** *(run `pdk explain InsufficientBalance`)*
> "And you don't even need a transaction. `pdk explain` is a queryable reference for every Portaldot error — what it means, and how to fix it. Every entry is verified against the live runtime."

**[2:15 — Scene 6: doctor + close]** *(run `pdk doctor`)*
> "Finally, `pdk doctor` checks your node — runtime, ink! compatibility, and whether the chain is actually producing blocks. Everything a Portaldot developer needs, in one CLI."
> "pdk is open source, tested against a live node, and built to become the standard Portaldot dev toolkit. Repo and live page are in the description. Thanks for watching."

---

## Delivery tips
- Total ~2:45. Keep it under 3 minutes.
- Re-record any take where a command stalls — the submission is a video, so only ship a clean run.
- Biggest moments: the FailLens decode (1:00) and the live `--watch` (1:30). Pause and let them breathe.
- On screen at least once: a real local-node tx hash, POT as the fee, and the raw-error → decoded before/after.
