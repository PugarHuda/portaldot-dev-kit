"""FailLens knowledge base: map a decoded error to a human fix suggestion.

Chain metadata tells the user *what* the error is. This module tells them
*what to do about it* — the layer that turns a decoder into a debugger.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path

import yaml

from pdk.core.decoder import DecodedError

_KB_PATH = Path(__file__).resolve().parent.parent / "data" / "error_fixes.yaml"
_INDEX_PATH = Path(__file__).resolve().parent.parent / "data" / "error_index.json"


class KbPathError(RuntimeError):
    """An explicitly-set PDK_KB_PATH / PDK_INDEX_PATH points at a missing file."""


def _resolve_override(env_var: str, default: Path) -> Path:
    """Resolve a data-file path, honoring an env override.

    pdk-ts reads PDK_KB_PATH / PDK_INDEX_PATH and documents them as
    "shared with pdk" — but the Python side ignored them entirely, so a
    user who set the override expecting BOTH CLIs to use their custom
    file got the bundled default here. This closes that mismatch.

    Matches pdk-ts's fail-fast rule: if the override is set but the file
    doesn't exist, raise instead of silently using the default — a
    typo'd path should surface, not degrade to an empty KB the user
    thinks is their custom one. Unset/empty falls back to the bundled
    file (which itself may still be absent -> graceful empty, so the
    hero command keeps working).
    """
    env = os.environ.get(env_var)
    if not env:
        return default
    path = Path(env)
    if not path.exists():
        raise KbPathError(f'{env_var}="{env}" does not exist (set explicitly, so we will not silently fall back).')
    return path


def _kb_path() -> Path:
    return _resolve_override("PDK_KB_PATH", _KB_PATH)


def _index_path() -> Path:
    return _resolve_override("PDK_INDEX_PATH", _INDEX_PATH)


def build_live_index(substrate) -> dict[str, str]:
    """Walk a connected node's runtime metadata and build the same
    ``"<pallet_index>.<error_index>"`` → ``"Pallet.ErrorName"`` map that
    the shipped ``error_index.json`` holds.

    Used by ``pdk kb --verify`` to diff the offline fast-path index
    against a live chain — the same extraction ``extract_index.py`` does,
    but in-process so a user can confirm the bundled index still matches
    their node (or discover it drifted after a runtime upgrade).
    """
    live: dict[str, str] = {}
    for pallet in substrate.metadata.pallets:
        idx = getattr(pallet, "index", None)
        if idx is None:
            try:
                idx = pallet.value["index"]
            except Exception:  # noqa: BLE001
                continue
        errors = getattr(pallet, "errors", None) or []
        for ei, err in enumerate(errors):
            name = getattr(err, "name", None) or (err.value.get("name") if hasattr(err, "value") else None)
            if name:
                live[f"{int(idx)}.{ei}"] = f"{pallet.name}.{name}"
    return live


def diff_index(shipped: dict[str, str], live: dict[str, str]) -> dict:
    """Compare the shipped index against a freshly-walked live index.

    Returns a structured report: matching count, and lists of
    ``mismatches`` (same code, different name — the dangerous kind:
    the fast path would return a WRONG name), ``missing`` (live has a
    code the shipped index lacks), and ``stale`` (shipped has a code the
    live chain no longer defines).
    """
    mismatches = [
        {"code": k, "shipped": shipped[k], "live": live[k]}
        for k in live
        if k in shipped and shipped[k] != live[k]
    ]
    missing = [{"code": k, "live": live[k]} for k in live if k not in shipped]
    stale = [{"code": k, "shipped": shipped[k]} for k in shipped if k not in live]
    matches = sum(1 for k in live if shipped.get(k) == live[k])
    return {
        "matches": matches,
        "mismatches": mismatches,
        "missing": missing,
        "stale": stale,
        "inSync": not (mismatches or missing or stale),
    }


def load_error_index() -> dict[str, str]:
    """Load the verified ``"<pallet_index>.<error_index>"`` → ``"Pallet.ErrorName"``
    map, extracted from the live ``portaldot-1002`` runtime metadata."""
    try:
        with _index_path().open(encoding="utf-8") as fh:
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
    """Load the error-fix knowledge base from data/error_fixes.yaml.

    A missing or unreadable KB is not fatal — it degrades to an empty
    dict, which pushes every lookup to tier 3 of `lookup_fix` (the
    metadata doc-comment fallback). This mirrors `load_error_index`'s
    behavior and keeps `pdk debug` — the hero command — decoding
    failures even if the curated KB got corrupted or excluded from a
    package build.
    """
    try:
        with _kb_path().open(encoding="utf-8") as fh:
            return yaml.safe_load(fh) or {}
    except (OSError, yaml.YAMLError):
        return {}


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
