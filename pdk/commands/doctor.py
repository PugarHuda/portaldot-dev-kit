"""`pdk doctor` — check node version and environment health (Tier 2 / bonus).

NOTE: the chain queries here are written against the documented
substrate-interface API but not yet validated against a live node — task #8.
"""

from __future__ import annotations

import typer
from rich.console import Console
from rich.table import Table

from pdk.config import DEFAULT_NODE_URL
from pdk.core.chain import connect

console = Console()


def run(
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
) -> None:
    """Report node version, runtime info, and contracts/ink! compatibility."""
    try:
        substrate = connect(node)
    except Exception as exc:  # noqa: BLE001 — surface any connection failure plainly
        console.print(f"[red]Cannot reach a Portaldot node at {node}[/red]")
        console.print(f"[dim]{exc}[/dim]")
        console.print("Start one first with [bold]pdk up[/bold] (inside WSL on Windows).")
        raise typer.Exit(1) from exc

    runtime = substrate.runtime_version or {}
    table = Table(title="pdk doctor — Portaldot node health", show_header=False)
    table.add_row("Endpoint", node)
    table.add_row("Chain", str(substrate.chain or "unknown"))
    table.add_row("Runtime spec", str(runtime.get("specName", "?")))
    table.add_row("Spec version", str(runtime.get("specVersion", "?")))

    has_contracts = "Contracts" in [p.name for p in substrate.metadata.pallets]
    if has_contracts:
        table.add_row(
            "Contracts pallet",
            "present — node v2.0.0 ships contracts API v5, which supports "
            "[bold]ink! 3.x only[/bold] (ink! 4.x+ will not deploy)",
        )
    else:
        table.add_row("Contracts pallet", "not found — use native pallets, not ink!")

    console.print(table)
