# Changelog

All notable changes to **pdk — Portaldot Dev Kit**. Published to PyPI:
`pip install portaldot-pdk`. Format follows [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]
### Changed
- **AI is now auto-on whenever `PDK_AI_KEY` is set** — no `--ai` flag needed.
  `pdk debug` and `pdk explain` automatically attach the "AI-suggested —
  UNVERIFIED" panel next to the verified KB entry. The `--ai` flag is still
  accepted as a force-attempt that surfaces the setup hint when no key is
  configured; new `--no-ai` opts out per-command.
- Pitch video re-rendered as a hybrid: slide intro + **live asciinema
  recording** of the full demo flow (with AI auto-on visible) + uniqueness
  slide + outro. Slide images regenerated with the correct repo URL and the
  current test count; reveal-style navigation footer removed via a new
  `?clean=1` screenshot mode on slide.html.
- Web pitch deck (`/slide`) synced — was claiming "twelve commands · 29 tests";
  now matches the canonical thirteen-commands / 38-tests numbers.
### Added
- 3 unit tests for the new AI UX (`--no-ai`, `--ai` force, auto-on with key)
  so the auto-on behavior can't silently regress. Test count: 38.
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
