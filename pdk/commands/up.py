"""`pdk up` — bring a local Portaldot dev environment from zero to ready.

The Portaldot node binary is Linux-only; on Windows, run pdk inside WSL.
"""

from __future__ import annotations

import shutil
import subprocess
import time

import typer
from rich.console import Console

from pdk.commands.accounts import render_balances
from pdk.config import DEFAULT_NODE_URL, NODE_BINARY
from pdk.core.chain import connect, trigger_demo_failure

console = Console()


def run(
    node_binary: str = typer.Option(NODE_BINARY, "--bin", help="Path to the portaldot_dev binary."),
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Node WS endpoint to wait on."),
    verify: bool = typer.Option(True, "--verify/--no-verify", help="Run a verification transaction."),
) -> None:
    """Start a local node, then run a verification transaction.

    The verification transaction pays POT gas and prints a tx hash — that hash
    is the project's native-deployment proof for the hackathon README.
    """
    # A second node would clash on the RPC port — bail early if one is up.
    try:
        connect(node)
    except Exception:  # noqa: BLE001 — no node yet is the normal, expected case
        pass
    else:
        console.print(f"[yellow]A Portaldot node is already running at {node}.[/yellow]")
        console.print("Use [bold]pdk debug[/bold] or [bold]pdk doctor[/bold] against it directly.")
        raise typer.Exit(0)

    binary = shutil.which(node_binary) or node_binary
    console.print(f"[bold]Starting Portaldot dev node[/bold] ({binary}) …")

    try:
        proc = subprocess.Popen(  # noqa: S603 — launching the user's own node binary
            [binary, "--dev", "--alice"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except FileNotFoundError:
        console.print(f"[red]Node binary '{node_binary}' not found.[/red]")
        console.print("Download it from the Portaldot Chain Info docs; on Windows, run pdk in WSL.")
        raise typer.Exit(1) from None

    substrate = _wait_for_node(node, timeout_s=60)
    if substrate is None:
        proc.terminate()
        console.print("[red]Node did not become reachable in time.[/red]")
        raise typer.Exit(1)

    console.print(f"[green]✓ Node is live[/green] at {node}")
    render_balances(substrate, console)

    if verify:
        # A failing demo transfer still pays POT gas, so its hash is valid
        # native-deployment evidence even though the dispatch itself fails.
        receipt = trigger_demo_failure(substrate)
        console.print(f"[green]✓ Verification tx submitted[/green] — hash: {receipt.extrinsic_hash}")
        console.print("[dim]Record this hash in the README as native-deployment proof.[/dim]")

    console.print("\nNode is running. Press Ctrl+C to stop it.")
    try:
        proc.wait()
    except KeyboardInterrupt:
        proc.terminate()
        console.print("\n[dim]Node stopped.[/dim]")


def _wait_for_node(node: str, timeout_s: int):
    """Poll until the node answers, or give up after timeout_s seconds."""
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            return connect(node)
        except Exception:  # noqa: BLE001 — node not up yet, keep polling
            time.sleep(2)
    return None
