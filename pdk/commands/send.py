"""`pdk send` — submit a real POT transfer from a dev account (pays POT as gas)."""

from __future__ import annotations

import typer
from rich.console import Console
from substrateinterface import Keypair

from pdk.config import DEFAULT_NODE_URL
from pdk.core.chain import connect, normalise_account_uri, pot_to_plancks, submit_call
from pdk.core.decoder import decode_receipt

console = Console()


def run(
    to: str = typer.Argument(..., help="Recipient: a //URI (//Bob) or an SS58 address."),
    amount: float = typer.Option(..., "--amount", help="POT to send."),
    sender: str = typer.Option("//Alice", "--from", help="Sender dev account URI."),
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
) -> None:
    """Send POT from a dev account — a real on-chain transaction, POT paid as gas."""
    if amount <= 0:
        console.print("[red]Amount must be positive.[/red]")
        raise typer.Exit(code=1)
    try:
        substrate = connect(node)
    except Exception as exc:  # noqa: BLE001
        console.print(f"[red]Cannot reach a Portaldot node at {node}[/red]")
        console.print(f"[dim]{exc}[/dim]")
        console.print("Start a node with [bold]pdk up[/bold] (run the node in WSL on Windows; pdk itself runs natively).")
        raise typer.Exit(code=1)

    keypair = Keypair.create_from_uri(normalise_account_uri(sender))
    # Normalise the recipient too: a git-bash-mangled `//Bob` → `/Bob`
    # would otherwise derive a DIFFERENT address and send real POT to
    # the wrong account with no warning.
    to_norm = normalise_account_uri(to)
    dest = Keypair.create_from_uri(to_norm).ss58_address if (to_norm.startswith("//") or "/" in to_norm) else to_norm
    try:
        receipt = submit_call(substrate, keypair, "Balances", "transfer",
                              {"dest": dest, "value": pot_to_plancks(amount)})
    except Exception as exc:  # noqa: BLE001
        console.print(f"[red]Send failed: {exc}[/red]")
        raise typer.Exit(code=1)

    if receipt.is_success:
        console.print(f"[green]✓ sent {amount:,} POT[/green]  {sender} → {to}")
        console.print(f"[dim]tx: {receipt.extrinsic_hash}[/dim]")
    else:
        decoded = decode_receipt(receipt)
        console.print(f"[red]✗ transfer failed: {decoded.name if decoded else 'unknown'}[/red]")
        console.print(f"[dim]Diagnose it: pdk debug {receipt.extrinsic_hash}[/dim]")
        raise typer.Exit(code=1)
