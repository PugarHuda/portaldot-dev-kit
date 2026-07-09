"""Unit tests for the pure (no-node) helpers in pdk.core.chain.

Covers the money-conversion and account-URI-normalization logic that
`send`, `simulate`, `seed`, and `keys` all route through. These are the
correctness-critical paths: `pot_to_plancks` feeds a REAL on-chain
transfer amount, and `normalise_account_uri` picks the recipient.
"""

from __future__ import annotations

from decimal import Decimal

import pytest

from pdk.core.chain import (
    POT_DECIMALS,
    detect_git_bash_mangling,
    normalise_account_uri,
    pot_to_plancks,
)


class TestPotToPlancks:
    def test_whole_number(self) -> None:
        assert pot_to_plancks(1) == 10**POT_DECIMALS
        assert pot_to_plancks(100) == 100 * 10**POT_DECIMALS

    def test_precision_cases_that_float_gets_wrong(self) -> None:
        # These are the exact values where `int(amount * 10**14)` loses a
        # planck to float64 rounding. The whole point of the helper.
        assert pot_to_plancks(2.3) == 230000000000000
        assert pot_to_plancks(0.7) == 70000000000000

    def test_matches_decimal_reference_across_a_range(self) -> None:
        for amt in [0.1, 0.7, 1.1, 2.3, 3.3, 100.7, 1234.5678, 9999.99, 0.00000000000001]:
            assert pot_to_plancks(amt) == int(Decimal(str(amt)) * 10**POT_DECIMALS), f"{amt} mismatch"

    def test_accepts_string_input(self) -> None:
        assert pot_to_plancks("2.3") == 230000000000000

    def test_zero_is_allowed(self) -> None:
        assert pot_to_plancks(0) == 0

    def test_negative_raises(self) -> None:
        with pytest.raises(ValueError, match="non-negative"):
            pot_to_plancks(-1.0)

    def test_non_numeric_raises(self) -> None:
        with pytest.raises(ValueError, match="not a valid POT amount"):
            pot_to_plancks("not a number")

    def test_truncates_sub_planck_toward_zero(self) -> None:
        # A plancks is indivisible; sub-planck remainders truncate down.
        # 1e-15 POT is 0.1 plancks -> 0.
        assert pot_to_plancks("0.000000000000001") == 0


class TestNormaliseAccountUri:
    def test_double_slash_passes_through(self) -> None:
        assert normalise_account_uri("//Alice") == "//Alice"

    def test_single_slash_git_bash_mangling_recovered(self) -> None:
        # Git Bash strips one leading slash: //Bob -> /Bob. Must recover.
        assert normalise_account_uri("/Bob") == "//Bob"

    def test_bare_name_becomes_uri(self) -> None:
        assert normalise_account_uri("Charlie") == "//Charlie"

    def test_ss58_address_passes_through(self) -> None:
        addr = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
        assert normalise_account_uri(addr) == addr

    def test_mnemonic_phrase_passes_through(self) -> None:
        phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
        assert normalise_account_uri(phrase) == phrase


class TestDetectGitBashMangling:
    def test_recognises_full_path_rewrite(self) -> None:
        hint = detect_git_bash_mangling("C:/Program Files/Git/Alice")
        assert hint is not None
        assert "//Alice" in hint

    def test_clean_uri_returns_none(self) -> None:
        assert detect_git_bash_mangling("//Alice") is None
        assert detect_git_bash_mangling("5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty") is None
