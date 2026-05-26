"""`pdk simulate` — preview a transfer's POT fee and feasibility before sending it.

The Portaldot runtime does not expose `system_dryRun`, so pdk estimates the
outcome from the real on-chain fee (`payment_queryInfo`) and the sender's real
balance — no transaction is submitted.
"""

from __future__ import annotations

import typer
from rich.console import Console
from rich.table import Table
from substrateinterface import Keypair

from pdk.config import DEFAULT_NODE_URL
from pdk.core.chain import POT_DECIMALS, connect, free_balance

console = Console()


def run(
    amount: float = typer.Option(1.0, "--amount", help="POT to simulate transferring (Alice → Bob)."),
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
) -> None:
    """Estimate a transfer's POT fee and whether it would succeed — without sending it."""
    if amount < 0:
        console.print("[red]Amount must be non-negative.[/red]")
        raise typer.Exit(code=1)

    try:
        substrate = connect(node)
    except Exception as exc:  # noqa: BLE001
        console.print(f"[red]Cannot reach a Portaldot node at {node}[/red]")
        console.print(f"[dim]{exc}[/dim]")
        console.print("Start one with [bold]pdk up[/bold] (inside WSL on Windows).")
        raise typer.Exit(code=1)

    alice = Keypair.create_from_uri("//Alice")
    bob = Keypair.create_from_uri("//Bob")
    try:
        value = int(amount * 10**POT_DECIMALS)
        call = substrate.compose_call(
            call_module="Balances", call_function="transfer_keep_alive",
            call_params={"dest": bob.ss58_address, "value": value},
        )
        info = substrate.get_payment_info(call=call, keypair=alice)
        fee = info["partialFee"] / 10**POT_DECIMALS
        balance = free_balance(substrate, alice.ss58_address)
    except Exception as exc:  # noqa: BLE001
        console.print(f"[red]Could not estimate the transfer: {exc}[/red]")
        raise typer.Exit(code=1)
    feasible = (amount + fee) <= balance

    table = Table(title="pdk simulate — transfer preview (not submitted)", show_header=False)
    table.add_row("From", "Alice → Bob")
    table.add_row("Amount", f"{amount:,.4f} POT")
    table.add_row("Estimated fee", f"{fee:.6f} POT")
    table.add_row("Weight", str(info.get("weight")))
    table.add_row("Sender balance", f"{balance:,.4f} POT")
    table.add_row(
        "Prediction",
        "[green]likely SUCCEED[/green]" if feasible
        else "[red]would FAIL — Balances.InsufficientBalance[/red]",
    )
    console.print(table)
    console.print("[dim]Nothing was submitted. Outcome is estimated from the real fee + balance "
                  "(this runtime has no system_dryRun).[/dim]")
