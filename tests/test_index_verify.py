"""Unit tests for `pdk kb --verify`'s index-diff logic.

`diff_index` is pure (no node), so the drift-classification — the part
that decides whether the offline fast-path is trustworthy against a
given chain — is tested here exhaustively. `build_live_index` (the
metadata walk) is verified end-to-end against a live node.
"""

from __future__ import annotations

from pdk.core.knowledge import diff_index


def test_identical_indexes_are_in_sync() -> None:
    shipped = {"6.2": "Balances.InsufficientBalance", "0.0": "System.InvalidSpecName"}
    report = diff_index(shipped, dict(shipped))
    assert report["inSync"] is True
    assert report["matches"] == 2
    assert report["mismatches"] == []
    assert report["missing"] == []
    assert report["stale"] == []


def test_mismatch_is_flagged_with_both_names() -> None:
    # Same code, different name — the dangerous case: the fast path would
    # return a WRONG error name.
    shipped = {"6.2": "Balances.WrongName"}
    live = {"6.2": "Balances.InsufficientBalance"}
    report = diff_index(shipped, live)
    assert report["inSync"] is False
    assert report["matches"] == 0
    assert report["mismatches"] == [
        {"code": "6.2", "shipped": "Balances.WrongName", "live": "Balances.InsufficientBalance"}
    ]


def test_missing_is_a_code_live_has_but_shipped_lacks() -> None:
    shipped: dict[str, str] = {}
    live = {"0.0": "System.InvalidSpecName"}
    report = diff_index(shipped, live)
    assert report["missing"] == [{"code": "0.0", "live": "System.InvalidSpecName"}]
    assert report["stale"] == []
    assert report["inSync"] is False


def test_stale_is_a_code_shipped_has_but_live_lacks() -> None:
    shipped = {"99.99": "Fake.Nonexistent"}
    live: dict[str, str] = {}
    report = diff_index(shipped, live)
    assert report["stale"] == [{"code": "99.99", "shipped": "Fake.Nonexistent"}]
    assert report["missing"] == []
    assert report["inSync"] is False


def test_matches_counts_only_exact_agreements() -> None:
    shipped = {"6.2": "Balances.InsufficientBalance", "6.3": "Balances.WrongName", "1.0": "Foo.Bar"}
    live = {"6.2": "Balances.InsufficientBalance", "6.3": "Balances.RightName"}
    report = diff_index(shipped, live)
    assert report["matches"] == 1  # only 6.2 agrees
    assert len(report["mismatches"]) == 1  # 6.3 differs
    assert len(report["stale"]) == 1  # 1.0 not on live
    assert report["inSync"] is False


def test_empty_indexes_are_trivially_in_sync() -> None:
    report = diff_index({}, {})
    assert report["inSync"] is True
    assert report["matches"] == 0
