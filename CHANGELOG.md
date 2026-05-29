# Changelog

All notable changes to **pdk — Portaldot Dev Kit**. Published to PyPI:
`pip install portaldot-pdk`. Format follows [Keep a Changelog](https://keepachangelog.com).

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
