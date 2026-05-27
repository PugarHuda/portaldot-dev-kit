"""FailLens knowledge base: map a decoded error to a human fix suggestion.

Chain metadata tells the user *what* the error is. This module tells them
*what to do about it* — the layer that turns a decoder into a debugger.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

import yaml

from pdk.core.decoder import DecodedError

_KB_PATH = Path(__file__).resolve().parent.parent / "data" / "error_fixes.yaml"
_INDEX_PATH = Path(__file__).resolve().parent.parent / "data" / "error_index.json"


def load_error_index() -> dict[str, str]:
    """Load the verified ``"<pallet_index>.<error_index>"`` → ``"Pallet.ErrorName"``
    map, extracted from the live ``portaldot-1002`` runtime metadata."""
    try:
        with _INDEX_PATH.open(encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {}


def resolve_code(module: int, error: int, index: dict[str, str] | None = None) -> str | None:
    """Resolve a raw ``Module: { index, error }`` code to ``"Pallet.ErrorName"``.

    This is FailLens for the cryptic code itself — the exact thing a node prints
    (``DispatchError { Module: { index: 6, error: 2 } }``) with no name attached.
    Returns ``None`` if the code is unknown in the verified index.
    """
    if index is None:
        index = load_error_index()
    return index.get(f"{module}.{error}")


@dataclass
class FixSuggestion:
    """A human-facing explanation and remediation for a decoded error."""

    summary: str
    steps: list[str] = field(default_factory=list)
    known: bool = True  # False when this is a fallback, not a curated entry
    matched_key: str | None = None  # KB key that matched, e.g. "balances.InsufficientBalance"


def load_knowledge() -> dict[str, dict]:
    """Load the error-fix knowledge base from data/error_fixes.yaml."""
    with _KB_PATH.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def lookup_fix(decoded: DecodedError, knowledge: dict[str, dict]) -> FixSuggestion:
    """Resolve a decoded error to a :class:`FixSuggestion`.

    Resolution happens in three tiers, from most to least specific:

    1. Exact match on ``"<pallet>.<ErrorName>"`` — the precise, curated entry.
    2. Name-only match — the same ``ErrorName`` under any pallet. This matters
       because the decoder cannot always recover the pallet name from a raw
       DispatchError, and because system-wide errors (``BadOrigin``) recur.
    3. Miss — no curated entry exists. Rather than giving up, FailLens falls
       back to the error's own doc comment from chain metadata and flags the
       result with ``known=False`` so the CLI can render it differently. This
       is what keeps FailLens useful across the long tail of runtime errors,
       not just the ~20 errors that happen to be curated.
    """
    # Tier 1 — exact "<pallet>.<ErrorName>" match.
    matched_key: str | None = None
    entry: dict | None = None
    if decoded.key in knowledge:
        matched_key, entry = decoded.key, knowledge[decoded.key]

    # Tier 2 — match by error name alone, under any pallet. The decoder cannot
    # always recover the pallet (substrate-interface reports a generic "Module"
    # type), so this also tells us the real pallet via the matched key.
    if entry is None:
        suffix = f".{decoded.name}".lower()
        for key, value in knowledge.items():
            if key.lower().endswith(suffix):
                matched_key, entry = key, value
                break

    # Tier 3 — miss: fall back to the chain-metadata doc comment.
    if entry is None:
        summary = (
            decoded.docs.strip()
            if decoded.docs and decoded.docs.strip()
            else f"{decoded.pallet}.{decoded.name}: no curated guidance yet."
        )
        return FixSuggestion(
            summary=summary,
            steps=[
                "Check the failing call's inputs and the signer's balance and permissions.",
                "Inspect on-chain state via the Portaldot explorer (portalscan.portaldot.io) to confirm preconditions.",
            ],
            known=False,
            matched_key=None,
        )

    return FixSuggestion(
        summary=entry["summary"],
        steps=list(entry.get("steps", [])),
        known=True,
        matched_key=matched_key,
    )
