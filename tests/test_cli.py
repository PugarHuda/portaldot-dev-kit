"""CLI smoke tests — exercise the typer app wiring without a node."""

from __future__ import annotations

from typer.testing import CliRunner

from pdk import __version__
from pdk.cli import app

runner = CliRunner()


def test_help_lists_all_commands() -> None:
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    for command in ("up", "accounts", "debug", "explain", "doctor", "simulate", "seed", "pallets"):
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
