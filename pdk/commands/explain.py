"""`pdk explain` — look up any Portaldot error in the knowledge base, no tx needed.

Turns the verified error knowledge base into a queryable reference: a developer
can ask what an error means and how to fix it *before* (or without) ever hitting
it on-chain.
"""

from __future__ import annotations

import json as jsonlib

import typer
from rich.console import Console
from rich.markup import escape
from rich.panel import Panel
from rich.table import Table

from pdk.core.decoder import DecodedError, strip_control_chars
from pdk.core.knowledge import load_knowledge, lookup_fix, resolve_code

console = Console()

_INDEX_SPEC_NAME = "portaldot"
_INDEX_SPEC_VERSION = 1002


def run(
    error: str = typer.Argument(
        None,
        help="Error name, e.g. 'InsufficientBalance' or 'balances.InsufficientBalance'. Omit to list all.",
    ),
    module: int = typer.Option(
        None, "--module", "-m",
        help="Raw module (pallet) index from a DispatchError, e.g. 6.",
    ),
    err_index: int = typer.Option(
        None, "--error", "-e",
        help="Raw error index from a DispatchError, e.g. 2. Decodes the bare code with --module.",
    ),
    ai: bool = typer.Option(
        False, "--ai",
        help="Force the AI diagnosis even when no key is set (prints the setup hint).",
    ),
    no_ai: bool = typer.Option(
        False, "--no-ai",
        help="Skip the AI diagnosis even if PDK_AI_KEY is set.",
    ),
    json_out: bool = typer.Option(False, "--json", help="Emit the decoded error as JSON (for scripts/CI)."),
) -> None:
    """Explain a Portaldot error — what it means and how to fix it — without a transaction.

    Pass a name, or decode a raw code straight from a node's output:
    `pdk explain --module 6 --error 2` turns `Module: { index: 6, error: 2 }`
    into the named error + its fix, using the verified runtime index.
    """
    kb = load_knowledge()
    from_index = False

    # Raw-code mode: resolve `Module: { index, error }` to a name, no tx needed.
    if module is not None or err_index is not None:
        if module is None or err_index is None:
            _emit_error(json_out, "Provide both --module and --error to decode a raw code.")
        resolved = resolve_code(module, err_index)
        if resolved is None:
            _emit_error(
                json_out,
                f"No error at module {module}, error {err_index} in the verified portaldot-1002 index.",
                detail="Indices are runtime-specific; check the module/error numbers.",
            )
        from_index = True
        if not json_out:
            console.print(f"[dim]Module {{ index: {module}, error: {err_index} }} → [bold]{resolved}[/bold][/dim]")
        error = resolved

    if not error:
        if json_out:
            typer.echo(jsonlib.dumps({"errors": [{"key": k, "summary": kb[k].get("summary", "")} for k in sorted(kb)]}))
            return
        table = Table(title=f"Errors pdk can explain ({len(kb)})", header_style="bold")
        table.add_column("error", style="cyan", no_wrap=True)
        table.add_column("summary")
        for key in sorted(kb):
            table.add_row(key, kb[key]["summary"])
        console.print(table)
        return

    pallet, _, name = error.partition(".") if "." in error else ("", "", error)
    decoded = DecodedError(pallet=pallet or "Unknown", name=name, docs="", extrinsic_call="")
    fix = lookup_fix(decoded, kb)

    if not fix.known:
        if json_out:
            typer.echo(jsonlib.dumps({"error": f"No curated entry for '{error}'."}))
            raise typer.Exit(code=1)
        console.print(f"[yellow]No curated entry for '{error}'.[/yellow]")
        if _should_run_ai(ai, no_ai) and _ai_section(pallet or "Unknown", name, decoded.docs, explicit=ai):
            return  # AI provided a diagnosis for the long-tail error
        hits = [k for k in sorted(kb) if name.lower() in k.lower()]
        if hits:
            console.print("Did you mean: " + ", ".join(f"[cyan]{h}[/cyan]" for h in hits))
        else:
            console.print("Run [bold]pdk explain[/bold] (no argument) to list every error.")
        raise typer.Exit(code=1)

    display = fix.matched_key or error

    if json_out:
        # Shape matches pdk-ts's `explain --json` so scripts consume either
        # CLI. Python explain is offline, so source is 'index' (raw-code
        # decode) or 'kb-name-only' (name lookup) — never 'metadata'.
        # For the raw-code path use the index's canonical casing
        # ("Balances.InsufficientBalance") like pdk-ts, not the lowercase
        # KB key; for name lookup mirror pdk-ts's entry.key.
        names_src = error if from_index else display
        src_pallet, _, src_name = names_src.partition(".") if "." in names_src else ("", "", names_src)
        report = {
            "palletIndex": module if from_index else -1,
            "errorIndex": err_index if from_index else -1,
            "palletName": src_pallet or (pallet or "Unknown"),
            "errorName": src_name or name,
            "key": display.lower(),
            "summary": fix.summary,
            "steps": fix.steps,
            "kbEntry": fix.known,
            "source": "index" if from_index else "kb-name-only",
        }
        if from_index:
            report["indexFingerprint"] = {"specName": _INDEX_SPEC_NAME, "specVersion": _INDEX_SPEC_VERSION}
        typer.echo(jsonlib.dumps(report))
        return
    # `fix.summary` can be the raw runtime doc comment (knowledge.py's
    # tier-3 fallback for any error outside the curated KB — i.e. most
    # errors on any non-Portaldot chain `--live` can query). Doc
    # comments are free-form Rust text with no syntax restriction, so a
    # malicious/compromised chain could embed Rich markup — including
    # `[link=...]` — that would otherwise render as a real clickable
    # hyperlink or fake alert styling inside pdk's own trusted-looking
    # output. escape() neutralizes it while leaving pdk's own styling
    # (the f-string's own [bold]/[cyan] tags) intact.
    body = (
        f"[bold cyan]{escape(display)}[/bold cyan]\n\n"
        f"[bold]What it means[/bold]\n{escape(fix.summary)}\n\n"
        f"[bold]How to fix[/bold]\n"
        + "\n".join(f"  {i}. {escape(step)}" for i, step in enumerate(fix.steps, 1))
    )
    console.print(Panel(body, title="pdk explain", border_style="cyan"))
    if _should_run_ai(ai, no_ai):
        _ai_section(pallet or (display.split(".")[0] if "." in display else "Unknown"),
                    name, decoded.docs, explicit=ai)


def _emit_error(json_out: bool, message: str, *, detail: str = "") -> None:
    """Emit an error and exit 1 — JSON under --json, Rich text otherwise.
    Keeps `pdk explain --json` a CI citizen on every exit path. Always raises."""
    if json_out:
        payload = {"error": message}
        if detail:
            payload["detail"] = detail
        typer.echo(jsonlib.dumps(payload))
    else:
        console.print(f"[red]{message}[/red]" if "Provide both" in message else f"[yellow]{message}[/yellow]")
        if detail:
            console.print(f"[dim]{detail}[/dim]")
    raise typer.Exit(code=1)


def _should_run_ai(ai_flag: bool, no_ai_flag: bool) -> bool:
    """AI runs automatically whenever a key is configured; --no-ai is the
    off-switch; --ai forces the attempt (so the setup hint surfaces when the
    user explicitly asked for AI but forgot the key)."""
    if no_ai_flag:
        return False
    if ai_flag:
        return True
    from pdk.core.ai import ai_available
    return ai_available()


def _ai_section(pallet: str, name: str, docs: str, *, explicit: bool = False) -> bool:
    """Print an AI-suggested diagnosis (clearly labelled unverified).

    Returns True if a diagnosis was produced. Never raises. When ``explicit``
    is True (user passed --ai), the missing-key hint is printed; otherwise we
    stay silent so auto-mode doesn't nag users without a key.
    """
    from pdk.core.ai import ai_available, ai_diagnose

    if not ai_available():
        if explicit:
            console.print("[dim]--ai needs PDK_AI_KEY (a free OpenRouter key) — set it to enable AI diagnosis.[/dim]")
        return False
    console.print("[dim]asking AI (grounded in chain metadata) …[/dim]")
    result = ai_diagnose(pallet, name, docs)
    if not result:
        console.print("[yellow]AI diagnosis unavailable right now.[/yellow]")
        return False
    # explain.py's own docs/name/pallet all trace to the trusted bundled
    # index (never live chain metadata — see the module docstring), but
    # LLM output is generative text with no guarantee it only reproduces
    # "safe" characters. Same defensive treatment as every other
    # AI-response render site for consistency across the whole surface.
    console.print(Panel(escape(strip_control_chars(result)), title="AI-suggested — UNVERIFIED (not a curated KB entry)",
                        border_style="yellow"))
    return True
