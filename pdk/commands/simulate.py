"""`pdk simulate` — preview a transfer's POT fee and feasibility before sending it.

The Portaldot runtime does not expose `system_dryRun`, so pdk estimates the
outcome from the real on-chain fee (`payment_queryInfo`) and the sender's real
balance — no transaction is submitted.
"""

from __future__ import annotations

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from substrateinterface import Keypair

from pdk.config import DEFAULT_NODE_URL
from pdk.core.chain import POT_DECIMALS, connect, free_balance, pot_to_plancks

console = Console()


def run(
    amount: float = typer.Option(1.0, "--amount", help="POT to simulate transferring (Alice → Bob)."),
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
    ai: bool = typer.Option(False, "--ai", help="Force the AI fee breakdown even when no key is set (prints the setup hint)."),
    no_ai: bool = typer.Option(False, "--no-ai", help="Skip the AI fee breakdown even if PDK_AI_KEY is set."),
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
        console.print("Start a node with [bold]pdk up[/bold] (run the node in WSL on Windows; pdk itself runs natively).")
        raise typer.Exit(code=1)

    alice = Keypair.create_from_uri("//Alice")
    bob = Keypair.create_from_uri("//Bob")
    try:
        value = pot_to_plancks(amount)
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
    if _should_run_ai(ai, no_ai):
        _ai_fee_breakdown(amount=amount, fee=fee, weight=info.get("weight"), explicit=ai)


def _should_run_ai(ai_flag: bool, no_ai_flag: bool) -> bool:
    if no_ai_flag:
        return False
    if ai_flag:
        return True
    from pdk.core.ai import ai_available
    return ai_available()


def _ai_fee_breakdown(*, amount: float, fee: float, weight, explicit: bool) -> None:
    """Ask the LLM to explain the fee components in plain language. Always
    labelled "AI-suggested"; the table above is the source of truth."""
    from pdk.core.ai import ai_available, ai_complete

    if not ai_available():
        if explicit:
            console.print("[dim]--ai needs PDK_AI_KEY (a free OpenRouter key) - set it to enable AI explanations.[/dim]")
        return
    console.print("[dim]asking AI to break down the fee ...[/dim]")
    system = (
        "You are a Substrate runtime engineer. Explain a transaction's POT fee "
        "to a developer. Use the structure: BASE FEE, LENGTH FEE, WEIGHT FEE, "
        "TIP (if any). One short sentence per component. Then one closing line "
        "on whether this fee is typical. Be terse, never invent numbers."
    )
    user = (
        f"Portaldot transfer simulation. Amount: {amount} POT. Estimated total "
        f"fee: {fee:.6f} POT. Reported weight: {weight}. Pallet: Balances. "
        "Call: transfer_keep_alive. Break this fee down."
    )
    text = ai_complete(system, user, max_tokens=240)
    if not text:
        console.print("[yellow]AI breakdown unavailable right now.[/yellow]")
        return
    console.print(Panel(text, title="AI-suggested fee breakdown - UNVERIFIED",
                        border_style="yellow"))
