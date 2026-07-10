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

from pdk.core.decoder import decode_receipt, find_receipt, strip_control_chars


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


class _FakeSubstrate:
    """Minimal substrate stub for find_receipt: a tiny chain that ends at genesis."""

    def __init__(self, blocks: dict[str, Any], head: str) -> None:
        self._blocks = blocks
        self._head = head

    def get_chain_head(self) -> str:
        return self._head

    def get_block(self, block_hash: str | None = None):
        # Unknown hash (e.g. genesis' zero-hash parent) has no block -> None.
        return self._blocks.get(block_hash)


def test_find_receipt_returns_none_past_genesis_without_crashing() -> None:
    # Regression: on a short chain, scanning a missing hash walks past genesis;
    # get_block then returns None and must NOT crash (was a TypeError).
    zero = "0x" + "0" * 64
    blocks = {
        "0xhead": {"extrinsics": [], "header": {"parentHash": "0xgenesis"}},
        "0xgenesis": {"extrinsics": [], "header": {"parentHash": zero}},
        # `zero` is absent -> get_block returns None (off the start of the chain).
    }
    sub = _FakeSubstrate(blocks, head="0xhead")
    assert find_receipt(sub, "0xdeadbeef", scan_blocks=200) is None


class TestStripControlChars:
    def test_removes_esc_and_bel(self) -> None:
        # Regression: a raw OSC 8 hyperlink escape sequence
        # (ESC ] 8 ; ; URL BEL text ESC ] 8 ; ; BEL) rendered as a REAL
        # clickable link in terminals that support it — completely
        # bypassing rich.markup.escape(), which only handles Rich's own
        # [tag] bracket syntax, not raw control bytes. A malicious/
        # compromised chain's doc comment (free-form Rust text, no
        # syntax restriction) could embed this.
        payload = "Balance too low. \x1b]8;;https://evil.example\x07Click here\x1b]8;;\x07 done"
        result = strip_control_chars(payload)
        assert "\x1b" not in result
        assert "\x07" not in result
        assert "Balance too low." in result
        assert "Click here" in result

    def test_preserves_tab_and_newline(self) -> None:
        assert strip_control_chars("a\tb\nc") == "a\tb\nc"

    def test_strips_full_c0_range_and_del(self) -> None:
        payload = "".join(chr(c) for c in range(0x00, 0x20) if c not in (0x09, 0x0A)) + chr(0x7F)
        assert strip_control_chars(payload) == ""

    def test_leaves_normal_text_untouched(self) -> None:
        text = "Balance too low. Fund the account or lower the amount."
        assert strip_control_chars(text) == text


def test_decode_receipt_strips_control_chars_from_docs() -> None:
    # End-to-end: the sanitizer is applied at construction time, so any
    # caller of decode_receipt() gets clean docs automatically.
    receipt = FakeReceipt(
        is_success=False,
        error_message={
            "type": "Balances",
            "name": "InsufficientBalance",
            "docs": "Too low \x1b]8;;https://evil.example\x07click\x1b]8;;\x07",
        },
    )
    decoded = decode_receipt(receipt)
    assert decoded is not None
    assert "\x1b" not in decoded.docs
    assert "\x07" not in decoded.docs
