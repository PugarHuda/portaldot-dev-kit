# Demo Day — 75-second script (one core flow)

Meets the progress-review rule: **one** end-to-end flow, runnable in 60–90s —
*user action → local Portaldot tx → POT gas → on-chain result → user-visible result.*

**Pre-flight (before recording):**
- Node running: `./portaldot_dev --dev --alice --ws-external --rpc-cors all` (purge first if stalled).
- A terminal + the dashboard open in a browser (`/dashboard`).
- `pdk` installed (`pip install portaldot-pdk`).

---

### [0:00–0:10] Hook — the pain
> "Portaldot is brand-new and Rust-first. When a transaction fails, this is all you get —"

*(show a raw failure)* `Module error: 0x0600…`

> "— a raw code. No message, no explanation, no fix. That's where most builders get stuck."

### [0:10–0:30] `pdk up` — native deployment, POT gas
*(run)* `pdk up`
> "pdk is one command line for the whole local dev loop. `pdk up` starts a node, shows the funded dev accounts, and proves it with a **real transaction that pays POT as gas**. There's the transaction hash — that's our native deployment, live."

### [0:30–0:55] `pdk debug --demo` — FailLens, the hero
*(run)* `pdk debug --demo`
> "Now the core. FailLens takes that failing transaction, reads the failure event, and decodes it against the chain's **own metadata** — so it never goes stale. Out comes plain language: **what happened**, and **how to fix it**. From a cryptic hex code to an answer, in one command."

### [0:55–1:08] Breadth + the visual
*(switch to the `/dashboard` browser tab)*
> "And it's a whole toolkit — twelve commands: send, simulate, seed, storage, watch, keys. Here's the dashboard: node health, decoded failures, accounts, all in one view. It's `pip install portaldot-pdk`, runs on Linux, macOS and Windows, and even gates CI."

### [1:08–1:15] Close
> "A starter kit helps you write Portaldot code. **pdk is what saves you when it breaks** — the only debugger for Portaldot. Thanks."

---

**What could fail in the demo (and the fallback):**
1. *Node stalled* (BABE epoch error) → `pdk doctor` shows it; `portaldot_dev purge-chain --dev -y` then restart. Purge before recording.
2. *Nonce/pool collision on a repeated demo* → `submit_call` retries with a tip; if needed, wait one block and re-run.
