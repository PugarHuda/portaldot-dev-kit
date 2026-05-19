"""`pdk debug` — FailLens: turn a cryptic failed transaction into a clear diagnosis."""

from __future__ import annotations

import typer
from rich.console import Console
from rich.panel import Panel

from pdk.config import DEFAULT_NODE_URL
from pdk.core.chain import connect, trigger_demo_failure
from pdk.core.decoder import DecodedError, decode_receipt, find_receipt
from pdk.core.knowledge import FixSuggestion, load_knowledge, lookup_fix

console = Console()


def run(
    tx_hash: str = typer.Argument(None, help="Hash of the failed transaction to diagnose."),
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
    demo: bool = typer.Option(False, "--demo", help="Trigger a failing transaction, then diagnose it."),
) -> None:
    """Diagnose a failed Portaldot transaction.

    Demo mode (`--demo`) submits its own failing transaction so a live demo
    always has a fresh failure to show; that submission pays POT gas.
    """
    if not demo and not tx_hash:
        console.print("[red]Provide a transaction hash, or use --demo.[/red]")
        raise typer.Exit(1)

    try:
        substrate = connect(node)
    except Exception as exc:  # noqa: BLE001 — surface any connection failure plainly
        console.print(f"[red]Cannot reach a Portaldot node at {node}[/red]")
        console.print(f"[dim]{exc}[/dim]")
        console.print("Start one with [bold]pdk up[/bold] (inside WSL on Windows).")
        raise typer.Exit(1) from exc

    if demo:
        receipt = trigger_demo_failure(substrate)
        tx_hash = receipt.extrinsic_hash
        console.print(f"[dim]demo: submitted failing tx {tx_hash}[/dim]")
    else:
        receipt = find_receipt(substrate, tx_hash)
        if receipt is None:
            console.print(f"[yellow]No transaction {tx_hash} found in recent blocks.[/yellow]")
            console.print("[dim]FailLens scans only recent blocks — an older tx may be out of range.[/dim]")
            raise typer.Exit(1)

    decoded = decode_receipt(receipt)
    if decoded is None:
        console.print("[green]That transaction succeeded — nothing to debug.[/green]")
        return

    fix = lookup_fix(decoded, load_knowledge())
    _render(str(tx_hash), decoded, fix)


def _render(tx_hash: str, decoded: DecodedError, fix: FixSuggestion) -> None:
    """Print the diagnosis: error -> explanation -> fix steps."""
    called = f"  [dim]· {decoded.extrinsic_call}[/dim]" if decoded.extrinsic_call else ""
    confidence = "" if fix.known else "  [yellow](no curated entry — metadata fallback)[/yellow]"

    # error_message reports a generic "Module" type for pallet errors; recover
    # the real pallet from the matched knowledge-base key when available.
    pallet = fix.matched_key.split(".")[0].title() if fix.matched_key else decoded.pallet
    error_label = (
        f"{pallet}.{decoded.name}"
        if pallet and pallet not in ("Module", "Unknown")
        else decoded.name
    )

    body = (
        f"[bold red]✗ {error_label}[/bold red]{called}\n\n"
        f"[bold]What happened[/bold]{confidence}\n{fix.summary}\n\n"
        f"[bold]How to fix[/bold]\n"
        + "\n".join(f"  {i}. {step}" for i, step in enumerate(fix.steps, 1))
    )
    console.print(
        Panel(
            body,
            title=f"FailLens — {tx_hash[:18]}…",
            border_style="red" if fix.known else "yellow",
        )
    )
