# Changelog

All notable changes to **pdk — Portaldot Dev Kit**. Published to PyPI:
`pip install portaldot-pdk`. Format follows [Keep a Changelog](https://keepachangelog.com).

TypeScript companion (`pdk-ts`) tracks its own changelog at
[`pdk-ts/CHANGELOG.md`](pdk-ts/CHANGELOG.md). Milestones cross-referenced
here for repo-level chronology.

## [Cross-repo milestones]
- **2026-07-09** — pdk-ts **0.2.0-alpha.3** ships `explain` (raw-code
  decoder — the unique feature). 7/14 commands now covered on the TS
  side. Verbose polkadot.js logs silenced from stdout so `--json`
  pipes cleanly. See `pdk-ts/CHANGELOG.md` for details.
- **2026-07-09** — pdk-ts **0.2.0-alpha.2** ships `pallets` · `storage`
  · `keys`. Read-only tier complete. Verified live against Polkadot
  RPC (61 pallets listed, block 32M returned).
- **2026-07-08** — pdk-ts **0.2.0-alpha.1** scaffold pushed. Real
  `@polkadot/api` chain queries, shared KB parser reads Python's
  `error_fixes.yaml`. `doctor` verified against `wss://rpc.polkadot.io`.

## [Unreleased — infra]
### Documented troubleshooting
- README now has a **Troubleshooting** section covering every real-world
  problem encountered while building / installing pdk this hackathon:
  Microsoft-Store-Python PATH (`'pdk' is not recognized`), pip cache
  serving v0.1.0, WSL2 localhost edge cases, stalled dev chain
  (BABE epoch error), AI key not picked up, fee-estimator quirk that
  rejects sends after Alice has paid demo fees, Rich Unicode crash on
  Windows cp1252 stdout, release.yml after repo rename, Vercel canonical
  domain 404 after rename. Each entry has the exact command to fix it.


### Changed
- **Release pipeline now uses an API token, not OIDC.** PyPI Trusted Publisher
  records pin to a specific owner+repo pair, and the mid-hackathon repo
  rename broke them. `release.yml` now reads `PYPI_API_TOKEN` from GitHub
  Secrets, so renames no longer require a manual reconfig on pypi.org.
  Added `workflow_dispatch` so a maintainer can re-trigger publish without
  pushing a new tag, and `skip-existing: true` so re-runs are idempotent.
  Verified by manually dispatching the workflow against v0.1.6 — green run.
- Re-linked the Vercel project to the renamed GitHub repo via
  `vercel git connect`. Future master pushes auto-deploy again.
- Web pages (`/`, `/demo`, `/dashboard`, `/errors`, `/slide`) all sync to
  v0.1.6 numbers; `/demo` page hosts an interactive asciinema replay of all
  14 commands plus an embedded 90 s narrated pitch video.
### Added
- README documents the Windows-Store-Python PATH caveat so first-time users
  don't hit "'pdk' is not recognized" after `pip install`.
- Comprehensive QA harness (gitignored, developer-local): 30 CLI smoke
  cases, 30 live-node integration cases, 24 stress + edge cases. Total
  ground-truth coverage = 40 pytest + 84 QA-harness = 124 deterministic
  checks across the 14 commands.

## [0.1.6] — 2026-05-29
### Added
- **`pdk ai-setup`** (new command — total now 14) — first-run wizard that
  prints OpenRouter sign-up steps tailored to the user's shell, tests the
  current key with a small chat-completion round-trip, and explains the
  optional `PDK_AI_MODEL` / `PDK_AI_BASE_URL` overrides. Replaces the
  "where do I even put the key" friction.
- **`pdk simulate --ai`** — adds an AI-suggested fee breakdown panel
  (base / length / weight / tip components) next to the verified fee table.
  Auto-on when `PDK_AI_KEY` is set; opt out with `--no-ai`.
- **`pdk report --ai`** — adds an AI-suggested pattern summary across the
  failure counts (clustered root causes, configuration smells). Same auto-on
  + `--no-ai` semantics.
- **`pdk doctor`** now shows an "AI (optional)" row with the configured key
  preview + model name (or a clear hint to run `pdk ai-setup`).
- 2 more unit tests covering the shared `_should_run_ai` gate on simulate
  and report, plus the `ai-setup --test` exit-code contract. Total: 40.
### Changed
- **AI is now auto-on whenever `PDK_AI_KEY` is set** — no `--ai` flag needed.
  `pdk debug` / `pdk explain` / `pdk simulate` / `pdk report` automatically
  attach the "AI-suggested — UNVERIFIED" panel next to the verified entry.
  The `--ai` flag is still accepted as a force-attempt that surfaces the
  setup hint when no key is configured; new `--no-ai` opts out per-command.
- Pitch video re-rendered as a hybrid: slide intro + **live asciinema
  recording** of the full demo flow (with AI auto-on visible) + uniqueness
  slide + outro. Slide images regenerated with the correct repo URL and the
  current test count; reveal-style navigation footer removed via a new
  `?clean=1` screenshot mode on slide.html.
- Web pitch deck (`/slide`) synced — was claiming "twelve commands · 29 tests";
  now matches the canonical fourteen-commands / 40-tests numbers.
### Fixed
- `test_debug_help_advertises_ci_gating` asserts on the option's description
  text (CI pipeline gating) instead of the flag name; Rich was wrapping
  `--exit-code` on CI's narrow no-TTY terminal which made the literal
  substring check brittle. First green CI in nine commits.

## [0.1.5] — 2026-05-27
### Fixed
- `--ai` hint now references OpenRouter (matches the default provider).
### Changed
- Docs synced to **13 commands** across README, submission, dashboard, and slides.

## [0.1.4] — 2026-05-27
### Added
- `pdk debug --ai` — AI diagnosis on a real failed transaction, grounded in its
  runtime metadata doc.
### Changed
- AI now defaults to OpenRouter's free OpenAI-compatible endpoint
  (`openai/gpt-oss-120b:free`); set `PDK_AI_KEY` and it works out of the box.
  Override with `PDK_AI_BASE_URL` / `PDK_AI_MODEL` for any provider.
### Fixed
- AI was unreachable: an em-dash in the `X-Title` HTTP header broke urllib's
  latin-1 header encoding (`UnicodeEncodeError`). Header values are now ASCII.

## [0.1.3] — 2026-05-26
### Added
- `pdk report` — scan recent blocks, decode and group **every** failed extrinsic
  by error type (table + `--json`). Failure analytics for triage.
- `pdk debug --demo --fix` — diagnose, then submit the corrected transaction and
  show it succeed (diagnose → fix → success).
- `--ai` (opt-in) — metadata-grounded AI diagnosis for the long tail, clearly
  labelled "AI-suggested"; the verified knowledge base stays the source of truth.

## [0.1.2] — 2026-05-26
### Added
- `pdk explain --module 6 --error 2` — decode the raw `DispatchError { Module }`
  code a node prints, with no hash and no name, via a verified 202-entry runtime
  index (`pdk/data/error_index.json`). Nothing else in the ecosystem decodes it.

## [0.1.1] — 2026-05-26
### Fixed
- `pdk debug <unknown-hash>` no longer crashes on a short chain — it walks past
  genesis cleanly and reports "not found".
- Force UTF-8 stdout at startup so Rich output never crashes with
  `UnicodeEncodeError` on a non-UTF-8 Windows console or a redirected pipe.

## [0.1.0] — 2026-05
### Added
- Initial release. **FailLens** (`pdk debug`) plus a 12-command CLI for the
  Portaldot local dev loop — native pallets + metadata-driven decoding, a verified
  29-entry fix knowledge base, real on-chain transactions paying POT as gas, and
  no mocks. Runs on Linux, macOS, and Windows.
