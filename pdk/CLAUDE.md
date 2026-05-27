# pdk/ — package internals

## Layout

- `cli.py` — defines the `typer` app and registers the 13 commands (`up`, `accounts`,
  `debug`, `explain`, `doctor`, `simulate`, `seed`, `pallets`, `send`, `storage`,
  `watch`, `keys`, `report`) plus the `--version` callback. Entry point `main()`.
  Forces UTF-8 stdout at import so Rich output never crashes on a non-UTF-8 console.
- `config.py` — static defaults only (node URL, block-scan depth, binary name).
- `commands/` — one file per command, each exposing a `run()` function with
  typer-annotated parameters. Command modules stay thin: parse args, call
  `core/`, render output. No chain logic here.
  - `up.py` — start a local node, show funded dev accounts, run a verification tx.
  - `accounts.py` — show pre-funded dev accounts + POT balances (`render_balances`).
  - `debug.py` — FailLens: `--demo`, `--watch`, `--json`, `--exit-code` (CI gate),
    `--fix` (demo: submit the corrected tx; else suggest), `--ai`, or a tx hash.
  - `explain.py` — query the KB by name, or decode a raw code (`--module/--error`);
    `--ai` adds a metadata-grounded AI diagnosis for the long tail.
  - `report.py` — scan recent blocks, decode + group every failure (analytics).
  - `doctor.py` — node/runtime/ink! info + chain-liveness (stall) check.
  - `simulate.py` — preview a transfer's fee + feasibility (no send).
  - `seed.py` — fund accounts from YAML fixtures. `pallets.py` — browse metadata.
  - `send.py` — real POT transfer. `storage.py` — read chain storage.
  - `watch.py` — stream all events. `keys.py` — generate/inspect a keypair.
- `core/` — the real work:
  - `chain.py` — `connect()` (uses the `substrate-node-template` type preset for
    Portaldot's legacy `LookupSource`); `submit_call()` (compose/sign/submit with a
    tip-retry on nonce clash); `trigger_demo_failure()`; `dev_account_balances()`;
    `free_balance()`.
  - `decoder.py` — `decode_receipt()`, `find_receipt()`, `failed_receipts_in_block()`.
    Decoding is metadata-driven via substrate-interface's `error_message`.
  - `knowledge.py` — `load_knowledge()` + `lookup_fix()` (3-tier: exact key →
    name-only → metadata-doc fallback); `load_error_index()` + `resolve_code()`
    (raw `Module: {index,error}` → `Pallet.Error` via the verified runtime index).
  - `report.py` — `scan_failures()` + `summarize()`/`label()` for failure analytics.
  - `ai.py` — optional, opt-in `ai_diagnose()` (env `PDK_AI_KEY`; returns `None`
    with no key — graceful fallback). Stdlib-only HTTP; never a hard dependency.
- `data/error_fixes.yaml` — knowledge base, keyed `"<pallet>.<ErrorName>"`, every
  name verified against the live runtime metadata.
- `data/error_index.json` — verified `"<pallet_idx>.<err_idx>" → "Pallet.Error"`
  map (202 entries) extracted from live `portaldot-1002` metadata; powers raw-code
  decoding. Regenerate with `extract_index.py` against a running node.

## Patterns

- Dataclasses for structured values: `DecodedError`, `FixSuggestion`.
- **No mocks or simulated chain responses anywhere in the product.** Every command
  talks to a live node; `pdk debug --demo` submits a *real* failing transaction.
  (Unit tests in `tests/` use a small `FakeReceipt` fixture — that is test-only.)
- `DecodedError.key` produces the knowledge-base lookup key.
