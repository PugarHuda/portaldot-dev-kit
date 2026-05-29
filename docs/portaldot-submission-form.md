# PortalDot Hackathon 2026 — Submission Form (copy-paste fields)

Aligned to the official **🌀 PortalDot Hackathon 2026 Submission Template**
(§ 2.2). Companion to `docs/dorahacks-submission.md` (the DoraHacks BUIDL form).

---

## Basic Info

**Project Name:** pdk — Portaldot Dev Kit

**Team Name:** AmpunBang

**Repository URL:** `https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang`
*(per § 2.1 `portaldot-hackathon-2026-[project]-[team]`; GitHub redirects from earlier names)*

**Demo Video URL:** `<YouTube link>` ⏳ *(upload `docs/pitch.mp4` and paste here)*

---

## Demo Scene Description  *(max 200 words)*

The pitch video walks one core flow reviewers can verify end-to-end on a real
Portaldot node:

1. `pdk up` boots a local Portaldot node (`portaldot_dev 2.0.0`, runtime
   `portaldot-1002`), shows the pre-funded dev accounts, and submits a real
   verification transaction paying POT as gas — its hash is the native-deployment
   proof.
2. `pdk debug --demo` submits a real *failing* transaction (`Balances.transfer`
   with an impossible amount), then FailLens decodes the resulting
   `System.ExtrinsicFailed` event against the chain's own metadata into a
   plain-language panel: ✗ `Balances.InsufficientBalance`, what happened, how to
   fix.
3. `pdk explain --module 6 --error 2` decodes the raw
   `DispatchError { Module: { index, error } }` code itself — no hash, no name —
   via a verified 202-entry runtime index. This is the cryptic thing a node
   actually prints; nothing else in the ecosystem decodes it.
4. `pdk debug --demo --fix` then submits the *corrected* transaction and shows
   it succeed (diagnose → fix → success on-chain).
5. `pdk report` lists every failed extrinsic in recent blocks, grouped by error
   type — triage analytics for the chain.

All steps consume real POT gas; nothing is mocked.

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

- `pip install portaldot-pdk` (0.1.5 live on PyPI); cross-platform — runs
  natively on Linux, macOS, and Windows (CI verifies Python 3.11 and 3.12).
- CI-gating: `pdk debug --json --exit-code` returns non-zero with a decoded
  diagnosis, so a Portaldot project can fail its pipeline with a clear reason
  (see `docs/ci-recipe.md`).
- Optional AI layer (`--ai`): grounded in the chain's metadata via an
  OpenAI-compatible endpoint (defaults to OpenRouter's free
  `openai/gpt-oss-120b:free`); labelled "AI-suggested — UNVERIFIED" so the
  verified KB stays the source of truth.
- 35 unit tests + 25 live E2E checks (graceful bad-node, edge cases, no-mock
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
