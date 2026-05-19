"""Unit tests for decode_receipt.

Turning a substrate-interface receipt into a DecodedError is pure logic, so it
is tested here with a fake receipt — no node required. The node-dependent
functions (find_receipt, trigger_demo_failure) are validated separately once a
live node is available (task #4).
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


def test_module_error_is_fully_decoded() -> None:
    receipt = FakeReceipt(
        is_success=False,
        error_message={
            "type": "Module",
            "module": "Balances",
            "name": "InsufficientBalance",
            "docs": ["Balance too low to send value."],
            "module_index": 5,
            "error_index": 2,
        },
    )
    decoded = decode_receipt(receipt)
    assert decoded is not None
    assert decoded.pallet == "Balances"
    assert decoded.name == "InsufficientBalance"
    assert decoded.raw == (5, 2)
    assert decoded.key == "balances.InsufficientBalance"
    assert "too low" in decoded.docs


def test_error_without_pallet_falls_back_to_unknown() -> None:
    receipt = FakeReceipt(
        is_success=False,
        error_message={"name": "BadOrigin", "docs": "Bad origin."},
    )
    decoded = decode_receipt(receipt)
    assert decoded is not None
    assert decoded.name == "BadOrigin"
    assert decoded.pallet == "Unknown"
    assert decoded.raw is None


def test_empty_error_message_is_handled_safely() -> None:
    decoded = decode_receipt(FakeReceipt(is_success=False, error_message=None))
    assert decoded is not None
    assert decoded.name == "UnknownError"
