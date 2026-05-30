# Discord — `⏰｜progress-review` post

> Per the May-29 announcement: "All entries must also include a project
> description in the progress-review channel. Failure to do so will result
> in the entry being considered invalid."

Copy-paste the block below into the `⏰｜progress-review` channel. It follows
the official PortalDot Hackathon 2026 Submission Form (§ 2.2) and the
in-Discord submission templates other teams have posted.

---

## **Basic Info**

- **Team Name:** AmpunBang
- **Project Name:** pdk — Portaldot Dev Kit
- **Track:** Builder Tools
- **Main Contact:** Pugar Huda Mantoro · hudapugar@gmail.com · @PugarHuda
- **Team Members:** Solo builder

## **Product Summary**

`pdk` is a Python CLI toolkit (`pip install portaldot-pdk`, v0.1.6 on
PyPI) for Portaldot developers. Its hero feature **FailLens** decodes any
failed Portaldot transaction into a plain-language diagnosis + fix,
resolved against the chain's own metadata. The unique trick is
**`pdk explain --module 6 --error 2`** — pdk is the only tool that
decodes the raw `Module { index, error }` code a node prints (no hash, no
name needed) via a verified 202-entry runtime index. Optional AI layer
attaches a grounded "AI-suggested — UNVERIFIED" panel next to the
verified knowledge base when `PDK_AI_KEY` is set; the KB stays the source
of truth. 14 commands cover the entire local dev loop.

## **Current MVP Status**

**What works:**
- 14 typed commands across the local dev loop: `up · accounts · debug ·
  explain · doctor · simulate · seed · pallets · send · storage · watch ·
  keys · report · ai-setup`
- FailLens decodes `System.ExtrinsicFailed` events against `portaldot-1002`
  metadata, then matches a 29-entry curated YAML knowledge base (3-tier
  lookup: exact key → name-only → metadata-doc fallback)
- Raw `DispatchError` code decoder via a 202-entry verified runtime index
- Real on-chain `Balances.transfer` calls paying POT as gas (no mocks)
- AI auto-on when `PDK_AI_KEY` is set, with `--no-ai` opt-out
- CI-gating mode (`pdk debug --json --exit-code` returns rc 2 with
  machine-readable JSON)
- Published to PyPI (`pip install portaldot-pdk` → v0.1.6); CI green on
  Python 3.11 & 3.12; 40 unit tests + 84 integration & stress cases
- Web companion at https://portaldot-pdk.vercel.app — landing, /demo (90 s
  narrated pitch video + in-browser asciinema replay of all 14 commands),
  /dashboard (interactive FailLens decoder), /errors (29 entries
  searchable), /slide (pitch deck)

**What is unfinished:**
- More example workflows in `docs/community-post.md`
- The "AI-suggested" panel is intentionally labelled UNVERIFIED until a
  human-reviewed entry is added to the verified KB

**What is mocked (must declare):** Nothing in the core flow. Every chain
interaction is a real on-chain transaction on a local Portaldot node, paid
in POT.

## **Local Portaldot Status**

- Can you run a local Portaldot node? **Yes**
- Is your project connected to local node? **Yes** — `ws://127.0.0.1:9944`
- Can contract / onchain logic be called? **Yes**

**Evidence:**

- Local node log: `Imported #[block] · portaldot_dev 2.0.0 · runtime
  portaldot-1002 · ws://127.0.0.1:9944`
- Call log: `pdk send //Bob --amount 1 --from //Alice` → `✓ sent 1 POT
  Alice → Bob · tx: 0x8b605579d6b512892f4394aa43937e1d762d34411b43c6a4aa9fa8a5dd4d546a`
- Fee log: `pdk simulate --amount 5` → `Estimated fee 0.014603 POT ·
  Prediction: likely SUCCEED`
- Code path: `pdk/core/chain.py → submit_call()`, `pdk/core/decoder.py →
  decode_receipt()`, `pdk/core/knowledge.py → lookup_fix()`
- README: https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang/blob/master/README.md
- Demo video: https://portaldot-pdk.vercel.app/demo *(pitch.mp4, 81 s,
  narrated; YouTube link will be added)*

## **POT Gas / Fee Usage**

- Can you show POT gas / fee usage? **Yes**
- Which action consumes POT? `Balances.transfer` / `transfer_keep_alive`
  extrinsics signed by `//Alice` (or any provided sender URI) — covers
  every `pdk debug --demo`, `pdk send`, and the `--fix` remediation
- How will you show it? `pdk accounts` shows Alice's balance ticking down
  by each demo's fee. `pdk simulate` prints the fee before sending. After
  any tx, the tx hash + fee are displayed.
- Evidence: `pdk simulate --amount 5 --no-ai` → `Estimated fee 0.014603 POT`

## **One Core Demo Flow (~90 s)**

1. **Setup is verifiable**: open https://portaldot-pdk.vercel.app/demo —
   the asciinema cast starts from a fresh `python -m venv` and runs
   `pip install portaldot-pdk` on camera (it's not a screen recording —
   it's a real terminal replay you can scrub).
2. `pdk doctor --no-liveness` — chain health table + new "AI (optional)" row.
3. `pdk accounts` — Alice/Bob/Charlie + their POT balances.
4. `pdk debug --demo` — submits a real failing `Balances.transfer`;
   FailLens decodes it into `✗ Balances.InsufficientBalance` with the fix.
   If `PDK_AI_KEY` is in env, a second yellow "AI-suggested — UNVERIFIED"
   panel renders side-by-side.
5. `pdk explain --module 6 --error 2` — the *unique* moment. Decodes the
   raw `Module { index, error }` code with no hash and no name.
6. `pdk debug --demo --fix` — diagnose AND submit the corrected tx; ✓ Fixed.
7. `pdk report` — failure analytics across recent blocks.

## **What Could Fail**

- Node restarted mid-demo → `pdk doctor` detects the BABE epoch stall and
  prints the exact recovery command. Mitigation: 50+ failure modes catalogued
  in `docs/TROUBLESHOOTING.md`.
- Old pip cache returns 0.1.0 → `pip install --upgrade --force-reinstall`.
- Windows Store Python doesn't put `pdk.exe` on PATH → use `python -m pdk.cli`.

## **Open Source & Reproducibility**

- **GitHub:** https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang
- **Key code folders:** `pdk/core/` (chain + decoder + knowledge), `pdk/commands/` (14 commands), `pdk/data/error_fixes.yaml` (KB) + `error_index.json` (raw code index)
- **README explains how to run locally:** Yes — Project Overview / Technical Architecture / Installation & Setup / Demo / Roadmap / Team / License sections all per the PortalDot 2026 template
- **License:** MIT

## **Demo Video**

- **Pitch video (90 s, voiced):** in repo at `docs/pitch.mp4`,
  hosted at https://portaldot-pdk.vercel.app/pitch.mp4 — YouTube link
  will be added shortly
- **In-browser interactive replay:** https://portaldot-pdk.vercel.app/demo
  *(asciinema-player; visitors can scrub the timeline + copy text from the
  terminal output of all 14 commands)*

---

**One-line install:**

```
pip install portaldot-pdk     # then: pdk --help     (Windows Store Python: python -m pdk.cli --help)
```
