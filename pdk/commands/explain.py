"""`pdk explain` — look up any Portaldot error in the knowledge base, no tx needed.

Turns the verified error knowledge base into a queryable reference: a developer
can ask what an error means and how to fix it *before* (or without) ever hitting
it on-chain.
"""

from __future__ import annotations

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from pdk.core.decoder import DecodedError
from pdk.core.knowledge import load_knowledge, lookup_fix

console = Console()


def run(
    error: str = typer.Argument(
        None,
        help="Error name, e.g. 'InsufficientBalance' or 'balances.InsufficientBalance'. Omit to list all.",
    ),
) -> None:
    """Explain a Portaldot error — what it means and how to fix it — without a transaction."""
    kb = load_knowledge()

    if not error:
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
        console.print(f"[yellow]No curated entry for '{error}'.[/yellow]")
        hits = [k for k in sorted(kb) if name.lower() in k.lower()]
        if hits:
            console.print("Did you mean: " + ", ".join(f"[cyan]{h}[/cyan]" for h in hits))
        else:
            console.print("Run [bold]pdk explain[/bold] (no argument) to list every error.")
        raise typer.Exit(code=1)

    display = fix.matched_key or error
    body = (
        f"[bold cyan]{display}[/bold cyan]\n\n"
        f"[bold]What it means[/bold]\n{fix.summary}\n\n"
        f"[bold]How to fix[/bold]\n"
        + "\n".join(f"  {i}. {step}" for i, step in enumerate(fix.steps, 1))
    )
    console.print(Panel(body, title="pdk explain", border_style="cyan"))
