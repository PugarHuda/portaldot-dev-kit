"""`pdk fund` — top up an account with POT from //Alice. Answers the #1
question in the hackathon Q&A channel ("how do I get POT?") with a command
instead of prose. Thin wrapper over `send` — same real on-chain transfer,
same signing tier, just pre-filled with the funding source and a sensible
default amount so a newcomer doesn't need to know //Alice exists yet.
"""

from __future__ import annotations

import typer

from pdk.commands.send import run as send_run
from pdk.config import DEFAULT_NODE_URL

DEFAULT_FUND_AMOUNT = 100.0


def run(
    to: str = typer.Argument(..., help="Account to fund: a //URI (//Bob) or an SS58 address."),
    amount: float = typer.Option(DEFAULT_FUND_AMOUNT, "--amount", help="POT to fund with (default 100)."),
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview the fee + feasibility, submit nothing."),
    json_out: bool = typer.Option(False, "--json", help="Emit machine-readable JSON (dry-run only)."),
) -> None:
    """Fund an account with POT from //Alice — a real on-chain transfer."""
    send_run(to=to, amount=amount, sender="//Alice", node=node, dry_run=dry_run, json_out=json_out)
