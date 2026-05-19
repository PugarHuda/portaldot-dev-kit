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
    substrate = connect(node)

    if demo:
        receipt = trigger_demo_failure(substrate)
        tx_hash = receipt.extrinsic_hash
        console.print(f"[dim]demo: submitted failing tx {tx_hash}[/dim]")
    else:
        if not tx_hash:
            console.print("[red]Provide a transaction hash, or use --demo.[/red]")
            raise typer.Exit(1)
        receipt = find_receipt(substrate, tx_hash)
        if receipt is None:
            console.print("[yellow]No transaction with that hash found in recent blocks.[/yellow]")
            raise typer.Exit(1)

    decoded = decode_receipt(receipt)
    if decoded is None:
        console.print("[green]That transaction succeeded — nothing to debug.[/green]")
        return

    fix = lookup_fix(decoded, load_knowledge())
    _render(str(tx_hash), decoded, fix)


def _render(tx_hash: str, decoded: DecodedError, fix: FixSuggestion) -> None:
    """Print the diagnosis: raw error -> explanation -> fix steps."""
    raw = str(decoded.raw) if decoded.raw else "non-module error"
    called = f"\n[dim]while calling:[/dim] {decoded.extrinsic_call}" if decoded.extrinsic_call else ""
    confidence = "" if fix.known else "  [yellow](no curated entry — metadata fallback)[/yellow]"

    body = (
        f"[bold red]✗ {decoded.pallet}.{decoded.name}[/bold red]  [dim]{raw}[/dim]{called}\n\n"
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
