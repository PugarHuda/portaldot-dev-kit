"""`pdk accounts` — show the pre-funded dev accounts and their POT balances.

This is the direct answer to the most-asked question in the hackathon Q&A —
"how do I get POT?". On a --dev chain the answer is: you already have it. These
accounts are funded at genesis; no faucet, no waiting.
"""

from __future__ import annotations

import json as jsonlib

import typer
from rich.console import Console
from rich.table import Table

from pdk.config import DEFAULT_NODE_URL
from pdk.core.chain import connect, dev_account_balances

console = Console()


def render_balances(substrate, con: Console) -> None:
    """Print a table of the pre-funded dev accounts and their POT balances."""
    table = Table(title="Pre-funded dev accounts — POT ready (no faucet needed)")
    table.add_column("account", style="cyan")
    table.add_column("address", overflow="fold")
    table.add_column("POT", justify="right", style="green")
    for name, address, pot in dev_account_balances(substrate):
        table.add_row(name, address, f"{pot:,.2f}")
    con.print(table)


def run(
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
    json_out: bool = typer.Option(False, "--json", help="Emit accounts + balances as JSON (for scripts)."),
) -> None:
    """List the dev accounts that are pre-funded with POT on a --dev chain."""
    try:
        substrate = connect(node)
    except Exception as exc:  # noqa: BLE001 — surface any connection failure plainly
        if json_out:
            typer.echo(jsonlib.dumps({"error": f"Cannot reach a Portaldot node at {node}", "detail": str(exc)}))
        else:
            console.print(f"[red]Cannot reach a Portaldot node at {node}[/red]")
            console.print(f"[dim]{exc}[/dim]")
            console.print("Start a node with [bold]pdk up[/bold] (run the node in WSL on Windows; pdk itself runs natively).")
        raise typer.Exit(code=1)

    if json_out:
        accounts = [
            {"name": name, "address": address, "pot": pot}
            for name, address, pot in dev_account_balances(substrate)
        ]
        typer.echo(jsonlib.dumps({"accounts": accounts}))
        return

    render_balances(substrate, console)
    console.print("[dim]These accounts are funded at genesis — use them to pay POT gas.[/dim]")
