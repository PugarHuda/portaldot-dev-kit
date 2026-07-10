"""`pdk watch` — live monitor of all chain events (optionally filtered by pallet).

`pdk debug --watch` focuses on failures; this streams every event as blocks are
produced — a general-purpose monitoring view of what the chain is doing.
"""

from __future__ import annotations

import time

import typer
from rich.console import Console
from rich.markup import escape

from pdk.config import DEFAULT_NODE_URL
from pdk.core.chain import connect

console = Console()


def run(
    pallet: str = typer.Option(None, "--pallet", help="Only show events from this pallet (e.g. Balances)."),
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
) -> None:
    """Stream chain events as blocks are produced (Ctrl+C to stop)."""
    try:
        substrate = connect(node)
    except Exception as exc:  # noqa: BLE001
        console.print(f"[red]Cannot reach a Portaldot node at {node}[/red]")
        console.print(f"[dim]{exc}[/dim]")
        console.print("Start a node with [bold]pdk up[/bold] (run the node in WSL on Windows; pdk itself runs natively).")
        raise typer.Exit(code=1)

    last = substrate.get_block_number(substrate.get_chain_head())
    scope = f" · pallet={pallet}" if pallet else ""
    console.print(f"[dim]Watching events from block #{last}{scope} — Ctrl+C to stop.[/dim]")
    try:
        while True:
            head = substrate.get_block_number(substrate.get_chain_head())
            for number in range(last + 1, head + 1):
                block_hash = substrate.get_block_hash(number)
                for event in substrate.get_events(block_hash):
                    value = event.value if hasattr(event, "value") else event
                    module, name = value.get("module_id"), value.get("event_id")
                    if pallet and (module or "").lower() != pallet.lower():
                        continue
                    # `attributes` is arbitrary event payload data — for
                    # `system.remark` (a standard extrinsic ANY account
                    # can submit, no chain compromise needed) it's a raw
                    # byte string the sender fully controls. f-string
                    # interpolation would call str() on it FIRST,
                    # flattening any embedded Rich markup into the outer
                    # string Rich then parses (verified: this differs
                    # from printing a dict directly, which Rich's own
                    # pretty-printer renders safely). Print the styled
                    # prefix and the raw attributes as two separate
                    # console.print() calls so attributes stays a
                    # structured object, never flattened into markup-
                    # parsed text. module/name escaped too — see
                    # pallets.py for why name fields aren't trusted.
                    console.print(f"[dim]#{number}[/dim] [cyan]{escape(str(module))}.{escape(str(name))}[/cyan]", end=" ")
                    console.print(value.get("attributes"))
            last = head
            time.sleep(2)
    except KeyboardInterrupt:
        console.print("\n[dim]stopped.[/dim]")
