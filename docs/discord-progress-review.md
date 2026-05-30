# Discord — `⏰｜progress-review` post (OFFICIAL TEMPLATE FORMAT)

> Per the May-29 announcement: "All entries must also include a project
> description in the progress-review channel. Failure to do so will result
> in the entry being considered invalid."

> Per the announcement, the thread title format is:
> **`[XX] Team Name - Project Name`**
> So mas would create a new thread titled e.g. **`[01] AmpunBang - pdk — Portaldot Dev Kit`**
> (`XX` = your team number if assigned, else any 2-digit; or omit if unassigned).

Copy-paste the block below into the new thread.

---

**Basic Info**
- Team Name: AmpunBang
- Project Name: pdk — Portaldot Dev Kit
- Track: Builder Tools for Portaldot
- Main Contact: Pugar Huda Mantoro · hudapugar@gmail.com · @PugarHuda
- Team Members: Pugar Huda Mantoro — Solo builder (developer + designer + ops)

**Product Summary** *(~280 words)*

pdk turns Portaldot's cryptic transaction failures into clear, actionable diagnoses, and gives every developer a one-command local dev loop. Its hero feature **FailLens** (`pdk debug`) decodes any failed Portaldot transaction against the chain's own metadata into a plain-language diagnosis + fix. The verified knowledge base has 29 entries, every key matched against live `portaldot-1002` metadata.

The unique innovation is **`pdk explain --module 6 --error 2`** — pdk decodes the *raw* `Module { index, error }` code a Portaldot node prints, with no hash and no name needed, via a verified 202-entry runtime index. This is the exact cryptic thing builders copy from logs — nothing else in the Portaldot ecosystem decodes it. The 202-entry index was extracted live from `portaldot-1002` metadata, not hard-coded.

Other commands: `pdk debug --demo` submits a real failing tx then decodes it; `pdk debug --demo --fix` submits the corrected one and shows it succeed; `pdk report` groups every recent failure by type; `pdk simulate` previews a fee before sending; `pdk send` is a real POT transfer; plus `up · accounts · doctor · seed · pallets · storage · watch · keys · ai-setup`. **14 commands in one CLI.**

AI is auto-on when `PDK_AI_KEY` is set — every `debug`/`explain`/`simulate`/`report` automatically attaches a yellow "AI-suggested — UNVERIFIED" panel grounded in chain metadata. The verified KB stays the source of truth; `--no-ai` opts out.

Use case: pdk removes the #1 onboarding barrier (cryptic raw errors) for new Portaldot builders. Adoption-ready via `pip install portaldot-pdk` (v0.1.6 on PyPI), CI-gating via `--json --exit-code`, cross-platform (Linux/macOS/Windows native).

**Current MVP Status**

What already works:
1. 14 typed commands against a live Portaldot node, all real on-chain transactions paying POT as gas.
2. FailLens decodes `System.ExtrinsicFailed` events against the chain's own metadata, then matches a 29-entry curated YAML knowledge base.
3. Raw `DispatchError` code decoder via a 202-entry verified runtime index (`pdk explain --module 6 --error 2`).
4. AI auto-on integration with `--no-ai` opt-out, grounded in chain metadata via OpenRouter free tier.
5. CI-gating mode (`pdk debug --json --exit-code`) returns rc 2 with machine-readable JSON.
6. Published to PyPI: `pip install portaldot-pdk` → v0.1.6 live. CI green on Python 3.11 & 3.12.
7. Web companion at https://portaldot-pdk.vercel.app — landing, /demo (asciinema replay), /dashboard (interactive FailLens), /errors (29 entries), /slide (pitch deck).
8. 40 pytest unit tests + 84 integration & stress cases = 124 deterministic checks.

What is unfinished:
1. Public testnet integration — Portaldot has no public RPC yet; pdk works on local `--dev` node which the organizers explicitly designate as the Season-1 environment.
2. More community-contributed entries in the error knowledge base.

What is mocked (must declare):
1. **Nothing in the core flow.** Every command that touches the chain submits a real transaction paying POT as gas. The single `FakeReceipt` fixture exists in `tests/test_decoder.py` for unit tests only — never in the product itself.

**Local Portaldot Status**

- Can you run a local Portaldot node? **Yes**
- Is your project connected to local node? **Yes** — `ws://127.0.0.1:9944`
- Can contract / onchain logic be called? **Yes** — every command calls live RPC

Evidence:
- Local node log: `portaldot_dev 2.0.0 · runtime portaldot-1002 · Imported #[N]` (`./portaldot_dev --dev --base-path /tmp/portaldot-dev`)
- Contract / call log: `pdk send //Bob --amount 1 --from //Alice` → `✓ sent 1 POT Alice → Bob · tx: 0x8b605579d6b512892f4394aa43937e1d762d34411b43c6a4aa9fa8a5dd4d546a`
- Code path: `pdk/core/chain.py` (`submit_call()`, `submit_valid_demo_transfer()`); `pdk/core/decoder.py` (`decode_receipt()`, `find_receipt()`); `pdk/core/knowledge.py` (`lookup_fix()`, `resolve_code()`)
- README: https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang/blob/master/README.md
- Demo video / GIF: https://youtu.be/EPNIRRc3qnw (81 s, voiced, all 14 commands)

**POT Gas / Fee Status**

- Can you show POT gas / fee usage? **Yes**
- Which action consumes POT? `Balances.transfer` / `transfer_keep_alive` extrinsics signed by `//Alice` or any provided sender URI. Used by `pdk debug --demo`, `pdk debug --demo --fix`, `pdk send`, and `pdk seed`.
- How will you show it? `pdk accounts` shows Alice's balance ticking down by the fee after each warm-up. `pdk simulate --amount 5 --no-ai` prints the estimated fee before sending. After a real tx, `pdk send` prints the tx hash + amount; for simulations, `pdk simulate` prints `Estimated fee: 0.014603 POT` plus a `likely SUCCEED / would FAIL` prediction.
- Evidence: `pdk simulate --amount 5 --no-ai` → `Estimated fee 0.014603 POT · Prediction: likely SUCCEED`. After warm-ups, `pdk accounts` shows Alice at `49,999.98 POT` (down from 50,000 by demo fees).

**One Core Demo Flow** *(runnable in 60–90 seconds)*

1. **Boot a fresh local Portaldot node** in WSL — the asciinema cast in the demo even starts from a `python -m venv` + `pip install portaldot-pdk` to prove setup is reproducible.
2. **`pdk doctor --no-liveness`** → chain health table + new "AI (optional)" status row.
3. **`pdk debug --demo`** → submits a real failing `Balances.transfer`; FailLens decodes it into `✗ Balances.InsufficientBalance` with the fix. With `PDK_AI_KEY` set, a second yellow "AI-suggested — UNVERIFIED" panel renders side-by-side.
4. **`pdk explain --module 6 --error 2`** → the unique moment. Decodes the raw `Module { index, error }` code with no hash and no name.
5. **`pdk debug --demo --fix`** → diagnose AND submit the corrected tx; ✓ Fixed, real on-chain. The corrected tx hash is printed.

What could fail in this demo?
1. Node restarted mid-demo (BABE epoch stall on `--dev`) — Mitigation: `pdk doctor` detects this and prints the exact `purge-chain` recovery command. Plus our 50+ failure-mode catalogue at `docs/TROUBLESHOOTING.md`.
2. AI cold-start latency on first request (`gpt-oss-120b:free` can take 15s) — Mitigation: `--no-ai` opt-out per-command keeps the demo deterministic.

**Open Source & Reproducibility**

- GitHub Link: https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang
- Key contract / code folder: `pdk/core/` (chain + decoder + knowledge + report + ai), `pdk/commands/` (14 commands), `pdk/data/` (`error_fixes.yaml` 29 entries + `error_index.json` 202 entries)
- Does README explain how to run locally? **Yes** — README follows the official PortalDot 2026 template (Project Overview / Technical Architecture / Smart Contracts / Installation & Setup / Demo / Roadmap / Team / License sections all present).

**Demo Video Plan**

- Do you have a demo video? **Yes**
- Link: https://youtu.be/EPNIRRc3qnw
  *(81 s, voiced, includes slide intro + 52-second live terminal recording showing `pip install portaldot-pdk` + all 14 commands against a real Portaldot node + uniqueness slide + outro. Plus interactive in-browser replay at https://portaldot-pdk.vercel.app/demo for reviewers who want to scrub the cast.)*
