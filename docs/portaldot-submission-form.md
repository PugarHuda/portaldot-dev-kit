# PortalDot Hackathon 2026 — Submission Form (copy-paste fields)

Aligned to the official **🌀 PortalDot Hackathon 2026 Submission Template**
(§ 2.2). Companion to `docs/dorahacks-submission.md` (the DoraHacks BUIDL form).

---

## Basic Info

**Project Name:** pdk — Portaldot Dev Kit

**Team Name:** AmpunBang

**Repository URL:** `https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang`
*(per § 2.1 `portaldot-hackathon-2026-[project]-[team]`; GitHub redirects from earlier names)*

**Demo Video URL:** https://youtu.be/EPNIRRc3qnw

---

## Demo Scene Description  *(max 200 words)*

The pitch video (≈59 s, voiced and subtitled) opens with two slides framing
the problem (Portaldot prints raw `Module { index, error }` codes with no
message), then cuts to a **live terminal recording** of pdk against a fresh
local Portaldot node (`portaldot_dev 2.0.0`, runtime `portaldot-1002`):

1. `pdk doctor` confirms the chain — runtime 1002, 31 pallets, contracts
   API v5 caveat surfaced.
2. `pdk accounts` shows the pre-funded dev accounts and their POT balances.
3. `pdk debug --demo` submits a real *failing* `Balances.transfer` and
   FailLens decodes `System.ExtrinsicFailed` against the chain's own
   metadata into a plain-language panel: ✗ `Balances.InsufficientBalance`,
   what happened, how to fix.
4. `pdk explain --module 6 --error 2` decodes the *raw* `DispatchError`
   code — no hash, no name — via a 202-entry runtime index. This is the
   cryptic thing a node actually prints; nothing else in the ecosystem
   decodes it.
5. `pdk debug --demo --fix` submits the corrected transaction and shows
   it succeed.
6. `pdk report` summarises every failure on recent blocks.

The closing slide reinforces the uniqueness. Every step consumes real POT
gas; nothing is mocked.

---

## Technical Highlights  *(optional, max 300 words)*

**Works natively on the real Portaldot node, with no ink! caveat.** Unlike
most ink!-contract submissions that deploy to `substrate-contracts-node`
(pallet-contracts v9+) because the Portaldot node ships Contracts API v5,
pdk uses **native pallets + metadata-driven decoding**, so its core runs on the
real node, real POT gas, no asterisk.

**Three verified assets that compound the moat:**

1. **Metadata-driven decoder** — FailLens resolves `DispatchError` against the
   chain's own metadata, so it never goes stale across runtime versions.
2. **Curated fix knowledge base** (`pdk/data/error_fixes.yaml`) — 29 entries,
   every key verified against `portaldot-1002`. Community-extensible.
3. **Verified runtime index** (`pdk/data/error_index.json`) — 202
   `(pallet_index, error_index) → Pallet.Error` pairs extracted live from
   `portaldot-1002` metadata, enabling the unique `--module/--error` raw-code
   decode.

**Adoption-ready, not a demo repo:**

- `pip install portaldot-pdk` (0.1.6 live on PyPI); cross-platform — runs
  natively on Linux, macOS, and Windows (CI verifies Python 3.11 and 3.12).
- CI-gating: `pdk debug --json --exit-code` returns non-zero with a decoded
  diagnosis, so a Portaldot project can fail its pipeline with a clear reason
  (see `docs/ci-recipe.md`).
- Auto-on AI layer: set `PDK_AI_KEY` once (free OpenRouter tier) and every
  `pdk debug` / `pdk explain` attaches an AI diagnosis grounded in the chain
  metadata - no `--ai` flag, no friction. Labelled "AI-suggested - UNVERIFIED"
  so the verified KB stays the source of truth. `--no-ai` opts out.
- 40 unit tests + 25 live E2E checks (graceful bad-node, edge cases, no-mock
  policy). Site (Next.js) live with interactive in-browser FailLens.

---

## Declaration

I confirm that:

- ☑ All code was independently developed during this hackathon (or legally
  modified from official Substrate templates / open-source libraries with their
  licenses preserved).
- ☑ All delivery requirements of this specification have been met:
  README per template, MIT license, full source at repository root, demo video,
  reproducible install/run steps, native Portaldot deployment with POT gas paid.
- ☑ I agree that the organizing committee may publicly review and technically
  reproduce the code.

— *Pugar Huda Mantoro · @PugarHuda · hudapugar@gmail.com*
