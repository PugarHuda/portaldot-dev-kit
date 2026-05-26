"""CLI smoke tests — exercise the typer app wiring without a node."""

from __future__ import annotations

from typer.testing import CliRunner

from pdk import __version__
from pdk.cli import app

runner = CliRunner()


def test_help_lists_all_commands() -> None:
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    for command in ("up", "accounts", "debug", "explain", "doctor", "simulate", "seed",
                    "pallets", "send", "storage", "watch", "keys"):
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


def test_debug_help_advertises_ci_gating() -> None:
    # The CI-gating contract must be discoverable from --help (no node needed).
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


def test_keys_inspect_uri() -> None:
    # Keypair derivation needs no node.
    result = runner.invoke(app, ["keys", "//Alice"])
    assert result.exit_code == 0
    assert "SS58 address" in result.output


def test_keys_generate() -> None:
    result = runner.invoke(app, ["keys"])
    assert result.exit_code == 0
    assert "Mnemonic" in result.output
