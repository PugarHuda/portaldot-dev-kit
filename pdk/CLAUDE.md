# pdk/ — package internals

## Layout

- `cli.py` — defines the `typer` app and registers commands. Entry point `main()`.
- `config.py` — static defaults only (node URL, scan depth, binary name).
- `commands/` — one file per command, each exposing a `run()` function with
  typer-annotated parameters. Command modules stay thin: parse args, call
  `core/`, render output. No chain logic here.
- `core/` — the real work:
  - `chain.py` — `connect()` returns a `SubstrateInterface`; `trigger_demo_failure()`
    submits a guaranteed-to-fail tx for `pdk debug --demo`.
  - `decoder.py` — `find_failed_extrinsic()` + `decode_dispatch_error()`.
    Decoding is metadata-driven: resolve (pallet index, error index) through
    `substrate.metadata`. Deterministic, adapts to any runtime version.
  - `knowledge.py` — `load_knowledge()` + `lookup_fix()`. Maps a `DecodedError`
    to a `FixSuggestion`.
- `data/error_fixes.yaml` — knowledge base, keyed `"<pallet>.<ErrorName>"`.

## Patterns

- Dataclasses for structured values: `FailedExtrinsic`, `DecodedError`,
  `FixSuggestion`.
- Functions needing a live node raise `NotImplementedError` with a task ref
  until the Day-1 gate passes — do not fake chain responses.
- `DecodedError.key` produces the knowledge-base lookup key.
