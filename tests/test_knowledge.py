"""Unit tests for the FailLens knowledge base and fix lookup.

These run without a node — they cover the pure logic that decides how
helpful a diagnosis is.
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest

import pdk.core.knowledge as knowledge_module
from pdk.core.decoder import DecodedError
from pdk.core.knowledge import load_knowledge, lookup_fix


def _err(pallet: str, name: str, docs: str = "") -> DecodedError:
    return DecodedError(pallet=pallet, name=name, docs=docs, extrinsic_call="")


def test_knowledge_base_is_well_formed() -> None:
    kb = load_knowledge()
    assert len(kb) >= 15
    for key, entry in kb.items():
        assert "." in key, f"key '{key}' must be '<pallet>.<ErrorName>'"
        assert entry.get("summary"), f"{key} missing summary"
        assert entry.get("steps"), f"{key} missing steps"


def test_exact_match_returns_curated_entry() -> None:
    fix = lookup_fix(_err("Balances", "InsufficientBalance"), load_knowledge())
    assert fix.known
    assert "POT" in fix.summary
    assert fix.steps


def test_name_only_fallback_when_pallet_unknown() -> None:
    # The decoder could not recover the pallet, but the name still resolves.
    fix = lookup_fix(_err("Unknown", "BadOrigin"), load_knowledge())
    assert fix.known
    assert "origin" in fix.summary.lower()


def test_miss_falls_back_to_metadata_docs() -> None:
    fix = lookup_fix(
        _err("Foo", "TotallyMadeUpError", docs="a doc comment from metadata"),
        load_knowledge(),
    )
    assert not fix.known
    assert "a doc comment from metadata" in fix.summary
    assert fix.steps  # a miss still gives generic guidance


def test_miss_without_docs_still_produces_a_summary() -> None:
    fix = lookup_fix(_err("Foo", "MysteryError"), load_knowledge())
    assert not fix.known
    assert "MysteryError" in fix.summary


def test_load_knowledge_degrades_gracefully_when_file_missing() -> None:
    """A missing/unreadable KB file must not crash `pdk debug`.

    Regression guard: load_knowledge() previously had no try/except
    around the file open, unlike its sibling load_error_index(). A
    corrupted install or excluded data file would crash the hero
    command with a raw FileNotFoundError instead of degrading to the
    tier-3 metadata-doc fallback the design already documents.
    """
    with patch.object(knowledge_module, "_KB_PATH", Path("/nonexistent/error_fixes.yaml")):
        assert load_knowledge() == {}


def test_lookup_fix_still_works_when_knowledge_base_is_empty() -> None:
    fix = lookup_fix(_err("Balances", "InsufficientBalance", docs="ran out of funds"), {})
    assert not fix.known
    assert "ran out of funds" in fix.summary


def test_pdk_kb_path_env_override_is_honored(tmp_path, monkeypatch) -> None:
    # pdk-ts documents PDK_KB_PATH as "shared with pdk"; Python used to
    # ignore it. A custom KB via the env var must actually load.
    custom = tmp_path / "custom_kb.yaml"
    custom.write_text(
        "CustomPallet.CustomError:\n  summary: from the env override\n  steps:\n    - do it\n",
        encoding="utf-8",
    )
    monkeypatch.setenv("PDK_KB_PATH", str(custom))
    kb = load_knowledge()
    assert "CustomPallet.CustomError" in kb
    # a genuine override, not a merge with the bundled KB
    assert "Balances.InsufficientBalance" not in kb


def test_pdk_kb_path_env_override_missing_file_fails_hard(monkeypatch) -> None:
    # A typo'd override must surface, not silently degrade to an empty KB
    # the user thinks is their custom one (matches pdk-ts fail-fast).
    from pdk.core.knowledge import KbPathError

    monkeypatch.setenv("PDK_KB_PATH", "/definitely/not/here.yaml")
    with pytest.raises(KbPathError):
        load_knowledge()


def test_pdk_index_path_env_override_missing_file_fails_hard(monkeypatch) -> None:
    from pdk.core.knowledge import KbPathError, load_error_index

    monkeypatch.setenv("PDK_INDEX_PATH", "/definitely/not/here.json")
    with pytest.raises(KbPathError):
        load_error_index()


def test_no_env_override_uses_bundled_default(monkeypatch) -> None:
    monkeypatch.delenv("PDK_KB_PATH", raising=False)
    monkeypatch.delenv("PDK_INDEX_PATH", raising=False)
    assert len(load_knowledge()) >= 15
