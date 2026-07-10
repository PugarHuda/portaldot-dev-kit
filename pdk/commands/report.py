"""`pdk report` — scan recent blocks and summarise every decoded failure.

Triage at a glance: "what's been failing on this chain, and why?" Each failed
extrinsic in range is decoded by FailLens and grouped by error type.
"""

from __future__ import annotations

import json as jsonlib

import typer
from rich.console import Console
from rich.markup import escape
from rich.panel import Panel
from rich.table import Table

from pdk.config import DEFAULT_NODE_URL, RECENT_BLOCKS_SCAN
from pdk.core.chain import connect
from pdk.core.decoder import strip_control_chars
from pdk.core.knowledge import load_knowledge, lookup_fix
from pdk.core.report import label, scan_failures, summarize

console = Console()


def run(
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
    blocks: int = typer.Option(RECENT_BLOCKS_SCAN, "--blocks", help="How many recent blocks to scan."),
    json_out: bool = typer.Option(False, "--json", help="Emit the report as JSON (for CI/scripts)."),
    ai: bool = typer.Option(False, "--ai", help="Force the AI pattern summary even when no key is set (prints the setup hint)."),
    no_ai: bool = typer.Option(False, "--no-ai", help="Skip the AI pattern summary even if PDK_AI_KEY is set."),
) -> None:
    """Decode every failed extrinsic in the last N blocks and group them by error."""
    try:
        substrate = connect(node)
    except Exception as exc:  # noqa: BLE001
        # Honor --json on the failure path too: a consumer piping
        # `pdk report --json | jq` must get parseable JSON even when the
        # node is unreachable, not human-readable Rich text (same
        # CI-citizen contract as `pdk debug --json`).
        if json_out:
            typer.echo(jsonlib.dumps({"error": f"Cannot reach a Portaldot node at {node}", "detail": str(exc)}))
        else:
            console.print(f"[red]Cannot reach a Portaldot node at {node}[/red]")
            console.print(f"[dim]{exc}[/dim]")
            console.print("Start a node with [bold]pdk up[/bold] (run the node in WSL on Windows; pdk itself runs natively).")
        raise typer.Exit(code=1)

    kb = load_knowledge()
    hits = scan_failures(substrate, blocks)

    labels: list[str] = []
    summaries: dict[str, str] = {}
    for hit in hits:
        fix = lookup_fix(hit.decoded, kb)
        lbl = label(hit.decoded, fix.matched_key)
        labels.append(lbl)
        summaries.setdefault(lbl, fix.summary)
    grouped = summarize(labels)

    if json_out:
        typer.echo(jsonlib.dumps({
            "blocks_scanned": blocks,
            "total_failures": len(hits),
            "by_error": [{"error": e, "count": c} for e, c in grouped],
        }))
        return

    if not hits:
        console.print(f"[green]✓ No failed extrinsics in the last {blocks} blocks.[/green]")
        console.print("[dim]A clean chain — or trigger one with [bold]pdk debug --demo[/bold].[/dim]")
        return

    table = Table(title=f"pdk report — failures in the last {blocks} blocks")
    table.add_column("error", style="red", no_wrap=True)
    table.add_column("count", justify="right", style="bold")
    table.add_column("what it means")
    for err, count in grouped:
        # `err` (via label(), when no curated KB match) and
        # summaries.get(err) (tier-3 metadata-doc fallback) both trace
        # back to decoded.name/pallet — fields substrate-interface reads
        # straight off the wire with no syntax validation. A genuine
        # Rust-compiled chain constrains these to identifier syntax, but
        # nothing stops a malicious/fake node speaking the same RPC
        # protocol from forging arbitrary bytes there. escape() both.
        table.add_row(escape(err), str(count), escape(summaries.get(err, "")))
    console.print(table)
    console.print(f"[bold]{len(hits)}[/bold] failed extrinsic(s) across {len(grouped)} error type(s). "
                  "Use [bold]pdk debug <hash>[/bold] to dig into one.")
    if _should_run_ai(ai, no_ai):
        _ai_pattern_summary(grouped, blocks, explicit=ai)


def _should_run_ai(ai_flag: bool, no_ai_flag: bool) -> bool:
    if no_ai_flag:
        return False
    if ai_flag:
        return True
    from pdk.core.ai import ai_available
    return ai_available()


def _ai_pattern_summary(grouped: list, blocks: int, *, explicit: bool) -> None:
    """Ask the LLM to identify patterns across the failure groups (e.g.
    "all balance-related: likely under-funded test accounts"). Labelled
    "AI-suggested"; the table above is the source of truth."""
    from pdk.core.ai import ai_available, ai_complete

    if not ai_available():
        if explicit:
            console.print("[dim]--ai needs PDK_AI_KEY (a free OpenRouter key) - set it to enable AI summaries.[/dim]")
        return
    console.print("[dim]asking AI to summarise failure patterns ...[/dim]")
    bullet_list = "\n".join(f"- {err}: {count}" for err, count in grouped)
    system = (
        "You are a senior Substrate engineer triaging recent failures on a "
        "Portaldot dev node. Given a count-by-error list, identify any "
        "patterns: clustered root causes, configuration smells, likely fixes. "
        "Be specific. Two to three short paragraphs maximum. If only one "
        "error type is present, say so plainly and skip pattern detection."
    )
    user = (
        f"Failure counts from the last {blocks} blocks:\n{bullet_list}\n\n"
        "What patterns do you see? What should the operator investigate first?"
    )
    text = ai_complete(system, user, max_tokens=320)
    if not text:
        console.print("[yellow]AI summary unavailable right now.[/yellow]")
        return
    # LLM output can echo back attacker-influenceable error labels (via
    # bullet_list, built from decoded.name/pallet) — same escape()/
    # strip_control_chars() treatment as every other AI-response render
    # site this sweep covered.
    console.print(Panel(escape(strip_control_chars(text)), title="AI-suggested pattern summary - UNVERIFIED",
                        border_style="yellow"))
