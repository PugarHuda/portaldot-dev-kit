"""CLI smoke tests — exercise the typer app wiring without a node."""

from __future__ import annotations

import os
import subprocess
import sys

from typer.testing import CliRunner

from pdk import __version__
from pdk.cli import app

runner = CliRunner()


def test_help_lists_all_commands() -> None:
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    for command in ("up", "accounts", "debug", "explain", "doctor", "simulate", "seed",
                    "pallets", "send", "storage", "watch", "keys", "report"):
        assert command in result.output


def test_version_flag_reports_version() -> None:
    result = runner.invoke(app, ["--version"])
    assert result.exit_code == 0
    assert __version__ in result.output


def test_debug_without_hash_or_demo_errors() -> None:
    # No node is contacted: the missing-argument check runs first.
    result = runner.invoke(app, ["debug"])
    assert result.exit_code != 0


def test_simulate_rejects_negative_amount() -> None:
    # The amount guard runs before any node connection.
    result = runner.invoke(app, ["simulate", "--amount", "-5"])
    assert result.exit_code == 1
    assert "non-negative" in result.output.lower()


def test_debug_help_advertises_ci_gating(monkeypatch) -> None:
    # The CI-gating contract must be discoverable from --help (no node needed).
    # Force a wide terminal: Rich auto-detects the runner's width and wraps
    # `--exit-code` to `--exit-\ncode` on the narrow no-TTY default that
    # GitHub Actions exposes, which would make the substring check brittle.
    monkeypatch.setenv("COLUMNS", "200")
    result = runner.invoke(app, ["debug", "--help"])
    assert result.exit_code == 0
    assert "--exit-code" in result.output


def test_explain_lists_all_when_no_argument() -> None:
    # Listing the knowledge base needs no node.
    result = runner.invoke(app, ["explain"])
    assert result.exit_code == 0
    assert "InsufficientBalance" in result.output


def test_explain_unknown_error_exits_nonzero_gracefully() -> None:
    # An unknown error is a clean "not found" (scriptable), not a crash.
    result = runner.invoke(app, ["explain", "ZzzNotARealError"])
    assert result.exit_code == 1
    assert "No curated entry" in result.output


def test_unicode_output_on_non_utf8_pipe_does_not_crash() -> None:
    # Regression: on a non-UTF-8 stdout (Windows cp1252 / a redirected pipe),
    # Rich output (box-drawing, em-dashes, ✗) crashed with UnicodeEncodeError.
    # pdk.cli forces UTF-8 at startup. `explain` renders a Rich panel, no node.
    env = {**os.environ, "PYTHONIOENCODING": "cp1252"}
    result = subprocess.run(
        [sys.executable, "-m", "pdk.cli", "explain", "InsufficientBalance"],
        capture_output=True, env=env,
    )
    assert result.returncode == 0
    assert b"Traceback" not in result.stderr


def test_explain_decodes_raw_module_error_code() -> None:
    # The hero case: decode `Module: { index: 6, error: 2 }` with no node.
    result = runner.invoke(app, ["explain", "--module", "6", "--error", "2"])
    assert result.exit_code == 0
    assert "Balances.InsufficientBalance" in result.output


def test_explain_raw_code_requires_both_indices() -> None:
    result = runner.invoke(app, ["explain", "--module", "6"])
    assert result.exit_code == 1


def test_explain_unknown_raw_code_is_graceful() -> None:
    result = runner.invoke(app, ["explain", "-m", "99", "-e", "99"])
    assert result.exit_code == 1
    assert "No error at module" in result.output


def test_resolve_code_maps_verified_index() -> None:
    from pdk.core.knowledge import resolve_code

    assert resolve_code(6, 2) == "Balances.InsufficientBalance"
    assert resolve_code(99, 99) is None


def test_keys_inspect_uri() -> None:
    # Keypair derivation needs no node.
    result = runner.invoke(app, ["keys", "//Alice"])
    assert result.exit_code == 0
    assert "SS58 address" in result.output


def test_keys_generate() -> None:
    result = runner.invoke(app, ["keys"])
    assert result.exit_code == 0
    assert "Mnemonic" in result.output
