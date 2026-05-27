"""`pdk report` — scan recent blocks and summarise every decoded failure.

Triage at a glance: "what's been failing on this chain, and why?" Each failed
extrinsic in range is decoded by FailLens and grouped by error type.
"""

from __future__ import annotations

import json as jsonlib

import typer
from rich.console import Console
from rich.table import Table

from pdk.config import DEFAULT_NODE_URL, RECENT_BLOCKS_SCAN
from pdk.core.chain import connect
from pdk.core.knowledge import load_knowledge, lookup_fix
from pdk.core.report import label, scan_failures, summarize

console = Console()


def run(
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
    blocks: int = typer.Option(RECENT_BLOCKS_SCAN, "--blocks", help="How many recent blocks to scan."),
    json_out: bool = typer.Option(False, "--json", help="Emit the report as JSON (for CI/scripts)."),
) -> None:
    """Decode every failed extrinsic in the last N blocks and group them by error."""
    try:
        substrate = connect(node)
    except Exception as exc:  # noqa: BLE001
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
        table.add_row(err, str(count), summaries.get(err, ""))
    console.print(table)
    console.print(f"[bold]{len(hits)}[/bold] failed extrinsic(s) across {len(grouped)} error type(s). "
                  "Use [bold]pdk debug <hash>[/bold] to dig into one.")
