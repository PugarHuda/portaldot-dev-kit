# pdk — Demo Day Rehearsal Script

Stage-ready companion for the live screen demo. Every number here is **real**
— captured by `demo_capture.sh` against a freshly purged local Portaldot node
(runtime `portaldot-1002`) on 2026-05-29.

> The shipped pitch video (`docs/pitch.mp4`, ~59 s) already includes a
> *short* live-terminal demo of this same flow. On stage, use this script
> when you want to walk reviewers through the demo at your own pace, take
> questions between commands, or improvise around blockers. Narration ref:
> `VIDEO_SCRIPT.md`.

---

## Pre-flight (do **before** going on stage)

1. **Purge + start node** (WSL):
   ```bash
   pkill -f portaldot-node || true
   rm -rf /tmp/portaldot-dev
   nohup ~/portaldot-node --dev --base-path /tmp/portaldot-dev >/tmp/p.log 2>&1 &
   ```
   Wait for `Imported #1`. Then `~/pdk-venv/bin/pdk doctor --no-liveness`
   should print `Runtime version 1002`.

2. **Warm the failure feed** so `pdk report` has data to summarise:
   ```bash
   ~/pdk-venv/bin/pdk debug --demo >/dev/null
   ~/pdk-venv/bin/pdk debug --demo >/dev/null
   ```
   This costs ~10s and seeds two `Balances.InsufficientBalance` entries.

3. **Terminal**: dark theme, font ≥ 16pt, full-height. Hide window chrome.
4. **One browser tab** open to `https://portalscan.portaldot.io` (backup
   visual if asked "is this really on-chain?").
5. **`pdk` alias** so audience sees `pdk`, not `~/pdk-venv/bin/pdk`:
   ```bash
   alias pdk="$HOME/pdk-venv/bin/pdk"
   ```

---

## The script — six steps, ~30 seconds clean

Total live runtime measured: **≈19s** of pdk work + your narration. Plan
**~3 minutes on stage** so each output gets a beat to land.

### 1 · "First, is the node alive?" *(target 5s, ⏱ measured 1.1s)*

```bash
pdk doctor --no-liveness
```

Expected output:

```
                    pdk doctor — Portaldot node health
┌──────────────────┬─────────────────────────────────────────────────────┐
│ Endpoint         │ ws://127.0.0.1:9944                                  │
│ Chain            │ Development                                          │
│ Runtime version  │ 1002                                                 │
│ Pallets          │ 31                                                   │
│ Contracts pallet │ present — node v2.0.0 ships contracts API v5, which │
│                  │ supports ink! 3.x only (ink! 4.x+ will not deploy)  │
│ Explorer         │ https://portalscan.portaldot.io                      │
└──────────────────┴─────────────────────────────────────────────────────┘
```

**Say:** *"Runtime 1002, 31 pallets, real chain. The ink! caveat in row five
matters — that's why most contract toolkits don't run here."*

---

### 2 · "Who has POT?" *(target 5s, ⏱ measured 1.0s)*

```bash
pdk accounts
```

Expected output:

```
          Pre-funded dev accounts — POT ready (no faucet needed)
┏━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━┓
┃ account ┃ address                                          ┃       POT ┃
┡━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━┩
│ Alice   │ 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY │ 49,999.98 │
│ Bob     │ 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty │ 50,000.00 │
│ Charlie │ 5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y │ 50,000.00 │
└─────────┴──────────────────────────────────────────────────┴───────────┘
```

**Say:** *"Alice is 0.02 POT below 50k — that's the warm-up we just spent
on failed transactions. Real gas, real POT."*

> 💡 If Alice's balance looks identical to Bob's, the warm-up didn't run.
> Run `pdk debug --demo` once manually before continuing.

---

### 3 · "What happens when a tx fails?" *(target 8s, ⏱ measured 3.7s)*

```bash
pdk debug --demo
```

Expected output:

```
demo: submitted failing tx 0x34dfb9…16e8
╭──────────────── FailLens — 0x34dfb9… ──────────────────╮
│ ✗ Balances.InsufficientBalance                          │
│                                                         │
│ What happened                                           │
│ You tried to transfer more POT than the sending         │
│ account holds.                                          │
│                                                         │
│ How to fix                                              │
│   1. Check the sender balance via the Portaldot         │
│      explorer or `pdk doctor`.                          │
│   2. Lower the transfer amount, or fund the account     │
│      first.                                             │
╰─────────────────────────────────────────────────────────╯
```

**Say:** *"That's a real failed transaction on the live node. FailLens reads
the `System.ExtrinsicFailed` event, decodes it against the chain's metadata,
and hands you a plain-language fix."*

---

### 4 · "What if I only have the raw code?" *(target 5s, ⏱ measured 0.6s)* — **THE UNIQUE MOMENT**

```bash
pdk explain --module 6 --error 2
```

Expected output:

```
Module { index: 6, error: 2 } → Balances.InsufficientBalance
╭──────────────────── pdk explain ────────────────────────╮
│ balances.InsufficientBalance                             │
│ … same panel as debug …                                  │
╰──────────────────────────────────────────────────────────╯
```

**Say (slowly, this is the punchline):**
*"This is what a node actually prints — `Module { index: 6, error: 2 }`.
No hash, no name. **Nothing else in the Portaldot ecosystem decodes this
to a human-readable error.** pdk does, against a verified 202-entry runtime
index."*

> 💡 If decode says "Unknown", the index file is missing — run
> `python -c "from pdk.core.knowledge import load_error_index as f; print(len(f()))"`
> should print `202`.

---

### 5 · "Can you fix it for me?" *(target 12s, ⏱ measured 11.2s)*

```bash
pdk debug --demo --fix
```

This is the slow step — `--fix` submits a corrected transfer and waits for
inclusion. Stay silent while it runs; let the audience feel it land.

Expected output (tail):

```
✗ Balances.InsufficientBalance
…
Applying fix — the demo transfer exceeded the balance; retrying with a
valid amount …
✓ Fixed — the corrected transfer succeeded.
tx: 0x0ae43b…98ab
```

**Say:** *"Diagnose, then fix — and the corrected transfer succeeds
on-chain. Same toolkit, two steps."*

---

### 6 · "What's the chain breaking on, overall?" *(target 5s, ⏱ measured 1.5s)*

```bash
pdk report
```

Expected output:

```
              pdk report — failures in the last 200 blocks
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ error                        ┃ count ┃ what it means            ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ Balances.InsufficientBalance │     4 │ You tried to transfer …  │
└──────────────────────────────┴───────┴──────────────────────────┘
4 failed extrinsic(s) across 1 error type(s).
```

**Say (close):** *"And that's triage. Recent blocks, grouped by failure type.
pdk: fourteen commands, one toolkit, real POT gas, no mocks. Repo and PyPI
links are in the submission."*

---

## Fallback plan (read this before showing up)

| Symptom on stage                          | Fix in 5 seconds                                              |
|-------------------------------------------|---------------------------------------------------------------|
| Node not running / `Connection refused`   | Switch to `pdk debug --demo` (still works without `--watch`); explain you'll show the pitch video. |
| `--fix` hangs > 20s                       | Ctrl-C, say "the corrected tx is in flight", show `pdk report` immediately. |
| Audience asks "is this really on-chain?"  | Open the browser tab → portalscan.portaldot.io and paste a tx hash. |
| `--ai` is requested live                  | Say *"runs over OpenRouter free tier with the chain's metadata as grounding"*. Do not run it on stage — the cold start is 5–15s and is not the story you want to land on. |
| You blank on the punchline                | The one sentence that matters: *"pdk is the only thing that decodes the raw `Module { index, error }` code Portaldot prints."* |

## What NOT to do

- ❌ Don't run `pdk watch` on stage. It's a long-running process; the timing
  becomes unpredictable, and your slot is too short.
- ❌ Don't run `pdk seed` on stage. The output is long and not the moat.
- ❌ Don't paste long tx hashes — they look like noise. Truncate to
  `0xabcd…1234` in the script if you need to read one aloud.
- ❌ Don't apologise for the ink! caveat. **Lean into it** — that's why
  competitors don't actually run on the real chain.

## Practising

```bash
wsl bash "/mnt/f/Hackathons/Hackathon Portaldot S1/demo_capture.sh"
```

Re-run this any time you change a command or after a fresh node restart.
The script:

1. Warms up two demo failures (so `report` has data).
2. Times every step (wall clock seconds + ⏱ per command).
3. Strips ANSI so the captured output paste-matches what audiences will see
   if your terminal lacks colour support.

If a step now takes **longer than the target** in the table above, simplify
the narration for that step before stage day.
