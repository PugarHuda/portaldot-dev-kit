"""CLI tests for `pdk explain` — pure knowledge-base lookup, no node required."""

from __future__ import annotations

from typer.testing import CliRunner

from pdk.cli import app

runner = CliRunner()


def test_explain_known_error_by_name() -> None:
    result = runner.invoke(app, ["explain", "InsufficientBalance"])
    assert result.exit_code == 0
    assert "InsufficientBalance" in result.output


def test_explain_qualified_key() -> None:
    result = runner.invoke(app, ["explain", "balances.KeepAlive"])
    assert result.exit_code == 0
    assert "KeepAlive" in result.output


def test_explain_unknown_error_exits_nonzero() -> None:
    result = runner.invoke(app, ["explain", "totallymadeup"])
    assert result.exit_code == 1


def test_explain_lists_all_without_argument() -> None:
    result = runner.invoke(app, ["explain"])
    assert result.exit_code == 0
    assert "balances.InsufficientBalance" in result.output
