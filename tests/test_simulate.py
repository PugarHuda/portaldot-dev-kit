"""Unit tests for `pdk simulate`'s feasibility prediction.

`predict_outcome` is pure arithmetic (no node), so the correctness of the
"likely SUCCEED / would FAIL" call is tested here exhaustively at the
boundaries — the part users trust to decide whether to actually send.
"""

from __future__ import annotations

from pdk.commands.simulate import predict_outcome

ED = 1.0  # existential deposit, in POT


def test_normal_transfer_with_plenty_left_succeeds() -> None:
    feasible, err = predict_outcome(amount=10, fee=0.01, balance=100, existential_deposit=ED)
    assert feasible is True
    assert err == ""


def test_draining_to_zero_fails_with_keepalive_not_success() -> None:
    # The regression: transfer_keep_alive won't drop the sender below ED,
    # so draining to exactly zero must be predicted FAIL. The old
    # `amount + fee <= balance` check called this "likely SUCCEED".
    feasible, err = predict_outcome(amount=99, fee=1.0, balance=100, existential_deposit=ED)
    assert feasible is False
    assert err == "Balances.KeepAlive"


def test_leaving_exactly_ed_behind_succeeds() -> None:
    # balance - (amount+fee) == ED exactly -> allowed (not below ED).
    feasible, err = predict_outcome(amount=98, fee=1.0, balance=100, existential_deposit=ED)
    assert feasible is True
    assert err == ""


def test_leaving_just_under_ed_fails_keepalive() -> None:
    feasible, err = predict_outcome(amount=98.5, fee=1.0, balance=100, existential_deposit=ED)
    assert feasible is False
    assert err == "Balances.KeepAlive"


def test_amount_exceeding_balance_is_insufficient_balance() -> None:
    feasible, err = predict_outcome(amount=200, fee=0.01, balance=100, existential_deposit=ED)
    assert feasible is False
    assert err == "Balances.InsufficientBalance"


def test_fee_tipping_over_balance_is_insufficient_balance() -> None:
    # amount == balance, any fee pushes total over -> InsufficientBalance,
    # not KeepAlive (the total genuinely exceeds what's there).
    feasible, err = predict_outcome(amount=100, fee=0.01, balance=100, existential_deposit=ED)
    assert feasible is False
    assert err == "Balances.InsufficientBalance"


def test_zero_existential_deposit_reduces_to_plain_balance_check() -> None:
    # With ED=0, draining to zero is allowed (no keep-alive constraint).
    feasible, err = predict_outcome(amount=99, fee=1.0, balance=100, existential_deposit=0.0)
    assert feasible is True
    assert err == ""
