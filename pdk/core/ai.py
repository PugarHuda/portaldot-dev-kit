"""Optional AI-assisted diagnosis, grounded in the chain's own metadata.

This is FailLens for the long tail: an error with no curated knowledge-base
entry can still get a real, contextual diagnosis from an LLM that is *grounded*
in the error name + its runtime metadata doc — RAG-for-debugging, not a generic
chatbot.

Fully optional and honest:
- With no API key (env ``PDK_AI_KEY``) it returns ``None`` and pdk falls back to
  the verified knowledge base — nothing breaks, no key required.
- Output is always labelled "AI-suggested" by callers; it is NOT a verified KB
  entry. The verified KB stays the source of truth.

Uses only the standard library (urllib) — no extra dependency. Defaults to
Groq's free OpenAI-compatible endpoint; override with PDK_AI_BASE_URL /
PDK_AI_MODEL for any OpenAI-compatible provider.
"""

from __future__ import annotations

import json
import os
import urllib.request

_DEFAULT_BASE = "https://api.groq.com/openai/v1/chat/completions"
_DEFAULT_MODEL = "llama-3.3-70b-versatile"

_SYSTEM = (
    "You are FailLens, a debugging assistant for the Portaldot blockchain "
    "(a Substrate/ink! chain whose native gas token is POT). Given a runtime "
    "dispatch error, reply in two parts: first 1-2 plain-language sentences on "
    "what it means, then 1-3 concrete numbered fix steps. Be specific and terse. "
    "Do not invent pallet names or APIs you are not given."
)


def ai_available() -> bool:
    """True if an API key is configured (env ``PDK_AI_KEY``)."""
    return bool(os.environ.get("PDK_AI_KEY"))


def ai_diagnose(pallet: str, name: str, docs: str = "", timeout: float = 20.0) -> str | None:
    """Return an LLM diagnosis for ``pallet.name`` grounded in ``docs``.

    Returns ``None`` if no key is configured or on any error (network, API,
    parsing) — callers treat ``None`` as "AI unavailable" and fall back.
    """
    key = os.environ.get("PDK_AI_KEY")
    if not key:
        return None
    base = os.environ.get("PDK_AI_BASE_URL", _DEFAULT_BASE)
    model = os.environ.get("PDK_AI_MODEL", _DEFAULT_MODEL)
    user = (
        f"Error: {pallet}.{name}\n"
        f"Runtime metadata doc: {docs.strip() or '(none provided)'}\n"
        "Diagnose this Portaldot failure and give fix steps."
    )
    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": user},
        ],
        "temperature": 0.2,
        "max_tokens": 320,
    }).encode("utf-8")
    request = urllib.request.Request(
        base, data=payload,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
        text = data["choices"][0]["message"]["content"].strip()
        return text or None
    except Exception:  # noqa: BLE001 — any failure means "AI unavailable", fall back
        return None
