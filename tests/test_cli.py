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


def test_debug_help_documents_auto_ai_and_no_ai(monkeypatch) -> None:
    # The auto-on AI UX is a deliberate design choice — make sure both
    # opt-out (--no-ai) and the force-attempt flag (--ai) stay discoverable
    # from the command's --help so reviewers can find them without docs.
    monkeypatch.setenv("COLUMNS", "200")
    result = runner.invoke(app, ["debug", "--help"])
    assert result.exit_code == 0
    output = " ".join(result.output.split())
    # Both flags should be mentioned by their distinguishing description text.
    assert "Skip the AI diagnosis" in output, "--no-ai opt-out is missing from help"
    assert "Force the AI diagnosis" in output, "--ai force flag is missing from help"


def test_debug_help_advertises_ci_gating(monkeypatch) -> None:
    # The CI-gating contract must be discoverable from --help (no node needed).
    # We can't substring-check the flag name itself: typer/Rich on a no-TTY
    # GitHub Actions runner inserts soft-wrap markers that break `--exit-code`
    # apart even at COLUMNS=200. Check the description text instead — it
    # word-wraps cleanly and is unique to this option.
    monkeypatch.setenv("COLUMNS", "200")
    result = runner.invoke(app, ["debug", "--help"])
    assert result.exit_code == 0
    # The phrase "CI pipeline gating" appears only in the --exit-code option's
    # description; finding it proves the flag is wired and documented.
    output_normalised = " ".join(result.output.split())
    assert "CI pipeline gating" in output_normalised


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


def test_no_ai_flag_suppresses_ai_when_key_is_set(monkeypatch) -> None:
    # Regression guard for the new auto-on AI UX: setting --no-ai must skip
    # the AI call even when a key is configured. We assert via the helper that
    # decides whether to run AI (avoids network), since `pdk explain <known>`
    # would otherwise contact OpenRouter when a key is in env.
    monkeypatch.setenv("PDK_AI_KEY", "test-key-not-used-because-we-skip")
    from pdk.commands.explain import _should_run_ai
    assert _should_run_ai(ai_flag=False, no_ai_flag=True) is False
    # And the default (no flag, key set) DOES auto-run.
    assert _should_run_ai(ai_flag=False, no_ai_flag=False) is True
    # --ai forces even when no_ai also passed? --no-ai wins (explicit opt-out).
    assert _should_run_ai(ai_flag=True, no_ai_flag=True) is False


def test_force_ai_flag_runs_even_without_key(monkeypatch) -> None:
    # --ai is the explicit-opt-in path — it should attempt the AI call even
    # when PDK_AI_KEY is missing, so the user sees the setup hint instead of
    # silently getting nothing.
    monkeypatch.delenv("PDK_AI_KEY", raising=False)
    from pdk.commands.explain import _should_run_ai
    assert _should_run_ai(ai_flag=True, no_ai_flag=False) is True
    # And without the flag + no key, auto-mode stays silent.
    assert _should_run_ai(ai_flag=False, no_ai_flag=False) is False


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
