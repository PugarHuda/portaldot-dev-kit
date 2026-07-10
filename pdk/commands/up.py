"""`pdk up` — bring a local Portaldot dev environment from zero to ready.

pdk itself runs natively on Windows. The Portaldot node binary, however, ships
only for Linux and macOS (no Windows build), so on Windows run the *node* in WSL
and let pdk connect to it.
"""

from __future__ import annotations

import os
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

    # The node binary has no Windows build, so `pdk up` can't launch it here.
    # pdk itself runs natively on Windows — only the node needs Linux/macOS/WSL.
    if os.name == "nt" and shutil.which(node_binary) is None:
        console.print("[yellow]No Windows build of the Portaldot node exists, so `pdk up` can't start it here.[/yellow]")
        console.print("On Windows, run the node in [bold]WSL[/bold]:")
        console.print("  [dim]./portaldot_dev --dev --alice --ws-external --rpc-cors all[/dim]")
        console.print(f"then drive it with pdk from Windows, e.g. [bold]pdk debug --demo --node {node}[/bold].")
        console.print("Or point pdk at any reachable RPC: [dim]--node wss://<endpoint>[/dim].")
        raise typer.Exit(1)

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
        console.print("Download it from the Portaldot node repo; on Windows, run the node in WSL (pdk runs natively).")
        raise typer.Exit(1) from None

    substrate = _wait_for_node(node, timeout_s=60)
    if substrate is None:
        proc.terminate()
        console.print("[red]Node did not become reachable in time.[/red]")
        raise typer.Exit(1)

    console.print(f"[green]✓ Node is live[/green] at {node}")

    # `_wait_for_node` only proves the WS handshake answers — chain
    # subsystems (RPC methods, metadata) can still be warming up, so the
    # balance query or the demo transfer below can genuinely fail. Without
    # this guard, an exception here would propagate past `proc.wait()`
    # entirely, leaving the just-spawned node process running in the
    # background with nothing to tell the user it's still alive — an
    # orphaned process holding the RPC port until manually killed.
    try:
        render_balances(substrate, console)
        if verify:
            # A failing demo transfer still pays POT gas, so its hash is
            # valid native-deployment evidence even though the dispatch
            # itself fails.
            receipt = trigger_demo_failure(substrate)
            console.print(f"[green]✓ Verification tx submitted[/green] — hash: {receipt.extrinsic_hash}")
            console.print("[dim]Record this hash in the README as native-deployment proof.[/dim]")
    except Exception as exc:  # noqa: BLE001
        proc.terminate()
        console.print(f"[red]Node started but verification failed: {exc}[/red]")
        console.print("[dim]The spawned node process has been stopped — nothing was left running.[/dim]")
        raise typer.Exit(code=1) from None

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
