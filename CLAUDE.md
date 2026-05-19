# pdk — Portaldot Dev Kit

## What this is

A Python CLI toolkit for the Portaldot blockchain. Hackathon submission for the
Portaldot Online Mini Hackathon S1 (Builder Tools track). Deadline 2026-05-31.

Hero feature: **FailLens** (`pdk debug`) — decodes failed Portaldot transactions
into human-readable diagnoses with fix suggestions.

## Stack

- Python 3.11+ (developed on 3.13)
- `typer` — CLI framework
- `substrate-interface` — chain interaction (imported as `substrateinterface`)
- `rich` — terminal output
- `pyyaml` — error-fix knowledge base

## Run

```bash
pip install -e .
pdk --help
pdk debug <txhash> --node ws://127.0.0.1:9944
pdk debug --demo
```

The Portaldot node binary is Linux-only — on Windows, run pdk inside WSL.

## Test

```bash
PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest tests/ -q
```

The env var is required: the global Python environment has third-party pytest
plugins (eth-ape) that crash on session start. A clean venv avoids this.

## Structure

```
pdk/
  cli.py          — typer app, command registration
  config.py       — node URL and defaults
  commands/       — one module per CLI command (up, debug, doctor)
  core/           — chain connection, error decoder, fix knowledge base
  data/           — error_fixes.yaml knowledge base
```

## Conventions

- Each CLI command is a `run()` function in `pdk/commands/<name>.py`, registered
  in `cli.py`. Keep command modules thin — logic lives in `core/`.
- Chain-dependent functions that need a live node are stubbed with
  `NotImplementedError` and a task reference until the Day-1 gate is passed.
- Code and CLI strings are in English; the knowledge base is human-facing prose.

## Status

Scaffold stage. Day-1 gate (node binary + WSL + SDK spike) must pass before
chain-dependent code is implemented. See the task list.
