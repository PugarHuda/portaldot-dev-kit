"""`pdk doctor` — check node version, environment health, and chain liveness."""

from __future__ import annotations

import time

import typer
from rich.console import Console
from rich.markup import escape
from rich.table import Table

from pdk.config import DEFAULT_NODE_URL, EXPLORER_URL
from pdk.core.chain import connect
from pdk.core.decoder import strip_control_chars

console = Console()


def run(
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
    liveness: bool = typer.Option(
        True, "--liveness/--no-liveness", help="Check that the chain is producing blocks (waits ~7s)."
    ),
) -> None:
    """Report node version, runtime info, ink! compatibility, and chain liveness."""
    try:
        substrate = connect(node)
        substrate.init_runtime()  # load runtime + metadata (lazy by default)
    except Exception as exc:  # noqa: BLE001 — surface any connection failure plainly
        console.print(f"[red]Cannot reach a Portaldot node at {node}[/red]")
        console.print(f"[dim]{exc}[/dim]")
        console.print("Start a node with [bold]pdk up[/bold] (run the node in WSL on Windows; pdk itself runs natively).")
        raise typer.Exit(code=1)

    pallet_names = [pallet.name for pallet in substrate.metadata.pallets]
    table = Table(title="pdk doctor — Portaldot node health", show_header=False)
    table.add_row("Endpoint", node)
    # `substrate.chain` is the node's self-reported display name via the
    # system_chain RPC — free text set in whatever chain spec the node
    # operator configured, with no identifier-syntax constraint at all
    # (unlike a pallet/error name). A malicious/misconfigured node needs
    # no transaction, no compromise — just its own RPC response — to put
    # markup or a raw terminal escape sequence in front of every `pdk
    # doctor --node <that-endpoint>` user.
    table.add_row("Chain", escape(strip_control_chars(str(substrate.chain or "unknown"))))
    table.add_row("Runtime version", escape(strip_control_chars(str(substrate.runtime_version))))
    table.add_row("Pallets", str(len(pallet_names)))

    has_contracts = "Contracts" in pallet_names
    if has_contracts:
        table.add_row(
            "Contracts pallet",
            "present — node v2.0.0 ships contracts API v5, which supports "
            "[bold]ink! 3.x only[/bold] (ink! 4.x+ will not deploy)",
        )
    else:
        table.add_row("Contracts pallet", "not found — use native pallets, not ink!")

    table.add_row("Explorer", EXPLORER_URL)
    # AI status row - lets users see at a glance whether AI auto-on will trigger
    # on debug/explain/simulate/report. Computed locally; never hits the network.
    from pdk.core.ai import ai_status
    ai = ai_status()
    if ai["configured"]:
        table.add_row("AI (optional)",
                      f"[green]configured[/green] - {ai['key_preview']} via {ai['model']} "
                      f"(auto-runs on debug/explain/simulate/report)")
    else:
        table.add_row("AI (optional)",
                      "not configured - run [bold]pdk ai-setup[/bold] to enable")
    console.print(table)

    if liveness:
        first = substrate.get_block_number(substrate.get_chain_head())
        time.sleep(7)  # longer than one 6s block, so a healthy chain advances
        second = substrate.get_block_number(substrate.get_chain_head())
        if second > first:
            console.print(f"[green]✓ chain is producing blocks[/green] (#{first} → #{second})")
        else:
            console.print(f"[red]⚠ chain is stalled at #{first} — no new blocks are being produced.[/red]")
            console.print("[dim]A dev chain DB can wedge (BABE 'Unexpected epoch change'). Reset it:[/dim]")
            console.print("[dim]  portaldot_dev purge-chain --dev -y   # then restart the node[/dim]")
            raise typer.Exit(code=1)
