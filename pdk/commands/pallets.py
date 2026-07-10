"""`pdk pallets` — discover the runtime's pallets, calls, and errors, from metadata.

Portaldot's docs are a raw module dump; this makes the on-chain surface
browsable from the terminal — what can I call, and what can go wrong.
"""

from __future__ import annotations

import typer
from rich.console import Console
from rich.markup import escape
from rich.table import Table

from pdk.config import DEFAULT_NODE_URL
from pdk.core.chain import connect
from pdk.core.decoder import strip_control_chars

console = Console()


def run(
    pallet: str = typer.Argument(None, help="Pallet name to inspect (omit to list all)."),
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
) -> None:
    """List the runtime's pallets, or inspect one pallet's calls and errors."""
    try:
        substrate = connect(node)
        substrate.init_runtime()
    except Exception as exc:  # noqa: BLE001
        console.print(f"[red]Cannot reach a Portaldot node at {node}[/red]")
        console.print(f"[dim]{exc}[/dim]")
        console.print("Start a node with [bold]pdk up[/bold] (run the node in WSL on Windows; pdk itself runs natively).")
        raise typer.Exit(code=1)

    pallets = substrate.metadata.pallets

    if not pallet:
        table = Table(title=f"Portaldot runtime — {len(pallets)} pallets")
        table.add_column("pallet", style="cyan")
        table.add_column("calls", justify="right")
        table.add_column("events", justify="right")
        table.add_column("errors", justify="right")
        for p in sorted(pallets, key=lambda x: x.name):
            table.add_row(p.name, str(len(p.calls or [])), str(len(p.events or [])), str(len(p.errors or [])))
        console.print(table)
        console.print("[dim]Inspect one: pdk pallets <name>[/dim]")
        return

    match = next((p for p in pallets if p.name.lower() == pallet.lower()), None)
    if match is None:
        console.print(f"[yellow]No pallet named '{pallet}'.[/yellow]")
        hits = [p.name for p in pallets if pallet.lower() in p.name.lower()]
        if hits:
            console.print("Did you mean: " + ", ".join(f"[cyan]{h}[/cyan]" for h in hits))
        raise typer.Exit(code=1)

    console.print(f"[bold cyan]{match.name}[/bold cyan]")
    if match.calls:
        ct = Table(title="calls (extrinsics)")
        ct.add_column("call", style="green")
        ct.add_column("args")
        for c in match.calls:
            ct.add_row(c.name, ", ".join(a.name for a in (getattr(c, "args", None) or [])))
        console.print(ct)
    if match.errors:
        et = Table(title="errors")
        et.add_column("error", style="red")
        et.add_column("docs")
        for e in match.errors:
            # Free-form Rust doc comment, no syntax restriction — unlike
            # e.name (a Rust identifier), a malicious/compromised chain
            # could embed Rich markup (Table.add_row() parses cell
            # content as markup) or a raw terminal escape sequence
            # (e.g. an OSC 8 hyperlink, which bypasses Rich's own
            # escape() entirely — see decoder.strip_control_chars).
            # Strip control bytes first, then escape Rich's [tag] syntax.
            docs = " ".join(e.docs).strip() if getattr(e, "docs", None) else ""
            et.add_row(e.name, escape(strip_control_chars(docs)[:74]))
        console.print(et)
