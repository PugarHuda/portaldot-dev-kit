"""Unit tests for `pdk storage`'s case-insensitive name resolution.

`_resolve_names` maps a user's pallet/item (any casing) to the runtime's
canonical names — so `storage balances totalissuance` works like the
canonical `Balances TotalIssuance`, matching pdk-ts. Tested with a mock
metadata object (no node).
"""

from __future__ import annotations

from types import SimpleNamespace

from pdk.commands.storage import _resolve_names


def _fake_substrate():
    """Minimal stand-in exposing metadata.pallets the way _resolve_names reads it."""
    system = SimpleNamespace(
        name="System",
        value={"storage": {"entries": [{"name": "Number"}, {"name": "Account"}]}},
    )
    balances = SimpleNamespace(
        name="Balances",
        value={"storage": {"entries": [{"name": "TotalIssuance"}]}},
    )
    return SimpleNamespace(metadata=SimpleNamespace(pallets=[system, balances]))


def test_resolves_all_lowercase_to_canonical() -> None:
    sub = _fake_substrate()
    assert _resolve_names(sub, "balances", "totalissuance") == ("Balances", "TotalIssuance")


def test_resolves_mixed_case() -> None:
    sub = _fake_substrate()
    assert _resolve_names(sub, "SYSTEM", "number") == ("System", "Number")


def test_canonical_names_pass_through_unchanged() -> None:
    sub = _fake_substrate()
    assert _resolve_names(sub, "System", "Account") == ("System", "Account")


def test_unknown_pallet_returns_input_so_query_reports_it() -> None:
    # We must NOT swallow a genuinely wrong name — return it unchanged so
    # substrate-interface produces its normal "not found" error.
    sub = _fake_substrate()
    assert _resolve_names(sub, "NopePallet", "Foo") == ("NopePallet", "Foo")


def test_known_pallet_unknown_item_keeps_canonical_pallet() -> None:
    sub = _fake_substrate()
    # pallet resolves, item doesn't — canonical pallet + original item.
    assert _resolve_names(sub, "balances", "NotAnItem") == ("Balances", "NotAnItem")


def test_metadata_access_failure_falls_back_to_input() -> None:
    broken = SimpleNamespace(metadata=None)
    assert _resolve_names(broken, "system", "number") == ("system", "number")
