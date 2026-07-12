"""`pdk fund` is a thin wrapper over `send` — the only logic worth locking
is that it forces sender=//Alice and defaults the amount, both without a
live node.
"""

from __future__ import annotations

from unittest.mock import MagicMock

from pdk.commands import fund


def test_fund_forces_sender_to_alice_and_defaults_amount(monkeypatch) -> None:
    mock_send = MagicMock()
    monkeypatch.setattr(fund, "send_run", mock_send)

    fund.run(to="//Bob", amount=fund.DEFAULT_FUND_AMOUNT, node="ws://x", dry_run=False, json_out=False)

    mock_send.assert_called_once_with(
        to="//Bob", amount=fund.DEFAULT_FUND_AMOUNT, sender="//Alice", node="ws://x", dry_run=False, json_out=False
    )


def test_fund_default_amount_is_positive() -> None:
    assert fund.DEFAULT_FUND_AMOUNT > 0
