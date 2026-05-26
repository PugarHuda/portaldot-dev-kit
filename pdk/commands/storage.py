"""`pdk storage` — read any value from the connected runtime's storage."""

from __future__ import annotations

from typing import List

import typer
from rich.console import Console

from pdk.config import DEFAULT_NODE_URL
from pdk.core.chain import connect

console = Console()


def run(
    pallet: str = typer.Argument(..., help="Pallet, e.g. System or Balances."),
    item: str = typer.Argument(..., help="Storage item, e.g. Account or TotalIssuance."),
    keys: List[str] = typer.Argument(None, help="Storage keys for maps (e.g. an SS58 address)."),
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
) -> None:
    """Query a storage value from the chain — inspect on-chain state directly."""
    try:
        substrate = connect(node)
    except Exception as exc:  # noqa: BLE001
        console.print(f"[red]Cannot reach a Portaldot node at {node}[/red]")
        console.print(f"[dim]{exc}[/dim]")
        console.print("Start a node with [bold]pdk up[/bold] (run the node in WSL on Windows; pdk itself runs natively).")
        raise typer.Exit(code=1)

    try:
        result = substrate.query(module=pallet, storage_function=item, params=list(keys) if keys else [])
    except Exception as exc:  # noqa: BLE001
        console.print(f"[red]Query failed: {exc}[/red]")
        console.print("[dim]Check pallet/item names with [bold]pdk pallets <pallet>[/bold].[/dim]")
        raise typer.Exit(code=1)

    title = f"{pallet}.{item}" + (f"  {list(keys)}" if keys else "")
    console.print(f"[bold cyan]{title}[/bold cyan]")
    console.print(result.value)
