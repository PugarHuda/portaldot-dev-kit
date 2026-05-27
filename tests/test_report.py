"""Unit tests for failure analytics (pdk report) and the optional AI layer.

The grouping/labelling logic is pure and node-free; the AI layer is tested for
its graceful no-key fallback (no network call is made without a key).
"""

from __future__ import annotations

from pdk.core.ai import ai_available, ai_diagnose
from pdk.core.decoder import DecodedError
from pdk.core.report import label, summarize


def test_summarize_counts_most_frequent_first() -> None:
    labels = [
        "Balances.InsufficientBalance",
        "Balances.InsufficientBalance",
        "System.BadOrigin",
    ]
    assert summarize(labels) == [
        ("Balances.InsufficientBalance", 2),
        ("System.BadOrigin", 1),
    ]


def test_summarize_breaks_ties_alphabetically() -> None:
    assert summarize(["B.y", "A.x"]) == [("A.x", 1), ("B.y", 1)]


def test_label_prefers_matched_key_over_generic_module() -> None:
    decoded = DecodedError(pallet="Module", name="InsufficientBalance", docs="", extrinsic_call="")
    assert label(decoded, "balances.InsufficientBalance") == "Balances.InsufficientBalance"


def test_label_falls_back_to_name_when_pallet_generic() -> None:
    decoded = DecodedError(pallet="Module", name="SomethingOdd", docs="", extrinsic_call="")
    assert label(decoded, None) == "SomethingOdd"


def test_label_uses_real_pallet_when_decoder_recovered_it() -> None:
    decoded = DecodedError(pallet="Balances", name="KeepAlive", docs="", extrinsic_call="")
    assert label(decoded, None) == "Balances.KeepAlive"


def test_ai_is_unavailable_and_returns_none_without_key(monkeypatch) -> None:
    monkeypatch.delenv("PDK_AI_KEY", raising=False)
    assert ai_available() is False
    # No key -> returns None immediately, no network call.
    assert ai_diagnose("Balances", "InsufficientBalance", "Balance too low.") is None
