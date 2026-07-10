"""`pdk storage` — read any value from the connected runtime's storage.

Values print as substrate-interface decodes them — raw, in the storage
item's native unit. Balance-type values (e.g. Balances.TotalIssuance,
System.Account's `data.free`) print in plancks, NOT POT — this command
is a generic browser over arbitrary storage (most of which has no
monetary meaning at all), so it never guesses which values are
Balance-shaped and auto-scales them. For a human POT amount divide by
10**14 (POT_DECIMALS) yourself, or use `pdk accounts` for pre-funded
dev account balances already formatted in POT.
"""

from __future__ import annotations

from typing import List

import typer
from rich.console import Console
from rich.markup import escape

from pdk.config import DEFAULT_NODE_URL
from pdk.core.chain import connect
from pdk.core.decoder import strip_control_chars

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
    console.print(f"[bold cyan]{escape(title)}[/bold cyan]")

    # console.print() on a bare string parses it as Rich markup — verified:
    # a plain string like "[link=https://evil.example]...[/link]" renders
    # as a real clickable link. Storage can genuinely hold free-form text
    # (an identity display name, an on-chain remark) set by any ordinary
    # account on any real chain — no compromise/malice required, just a
    # normal transaction. Structured values (dict/list/int, the common
    # case) are unaffected: Rich's pretty-printer shows embedded strings
    # as their Python repr, not re-parsed markup — verified separately.
    value = result.value
    if isinstance(value, str):
        console.print(escape(strip_control_chars(value)))
    else:
        console.print(value)
