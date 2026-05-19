"""Unit tests for decode_receipt.

Turning a substrate-interface receipt into a DecodedError is pure logic, so it
is tested here with a fake receipt — no node required. The fake mirrors the
real ``error_message`` shape verified against the installed substrate-interface:
``{'type': <pallet>, 'name': <ErrorName>, 'docs': <str|list>}``.

The node-dependent functions (find_receipt, trigger_demo_failure) are validated
separately once a live node is available (task #4).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from pdk.core.decoder import decode_receipt


@dataclass
class FakeReceipt:
    """Stand-in for substrate-interface's ExtrinsicReceipt."""

    is_success: bool
    error_message: dict[str, Any] | None = None
    extrinsic: Any = None


def test_successful_receipt_returns_none() -> None:
    assert decode_receipt(FakeReceipt(is_success=True)) is None


def test_module_error_is_decoded() -> None:
    receipt = FakeReceipt(
        is_success=False,
        error_message={
            "type": "Balances",
            "name": "InsufficientBalance",
            "docs": "Balance too low to send value.",
        },
    )
    decoded = decode_receipt(receipt)
    assert decoded is not None
    assert decoded.pallet == "Balances"
    assert decoded.name == "InsufficientBalance"
    assert decoded.key == "balances.InsufficientBalance"
    assert "too low" in decoded.docs


def test_error_docs_as_list_is_joined() -> None:
    receipt = FakeReceipt(
        is_success=False,
        error_message={"type": "System", "name": "BadOrigin", "docs": ["Bad", "origin."]},
    )
    decoded = decode_receipt(receipt)
    assert decoded is not None
    assert decoded.docs == "Bad origin."


def test_error_without_type_falls_back_to_unknown() -> None:
    receipt = FakeReceipt(is_success=False, error_message={"name": "SomethingOdd"})
    decoded = decode_receipt(receipt)
    assert decoded is not None
    assert decoded.pallet == "Unknown"
    assert decoded.name == "SomethingOdd"


def test_empty_error_message_is_handled_safely() -> None:
    decoded = decode_receipt(FakeReceipt(is_success=False, error_message=None))
    assert decoded is not None
    assert decoded.name == "UnknownError"
