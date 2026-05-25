"""`pdk keys` — generate or inspect a Substrate keypair (Portaldot SS58 format 42).

Portaldot ships `subkey`, but a built-in command keeps account creation inside
the same workflow — no separate tool, no context switch.
"""

from __future__ import annotations

import typer
from rich.console import Console
from rich.table import Table
from substrateinterface import Keypair

console = Console()
SS58 = 42  # Portaldot chain spec


def _show(keypair: Keypair, label: str, mnemonic: str | None = None) -> None:
    table = Table(show_header=False, title=f"keypair — {label}")
    table.add_row("SS58 address", keypair.ss58_address)
    table.add_row("Public key", "0x" + keypair.public_key.hex())
    if mnemonic:
        table.add_row("Mnemonic", mnemonic)
    console.print(table)


def run(
    source: str = typer.Argument(None, help="A //URI (//Alice) or mnemonic to inspect. Omit to generate a new key."),
    words: int = typer.Option(12, "--words", help="Mnemonic word count when generating (12/15/18/21/24)."),
) -> None:
    """Generate a fresh keypair, or inspect one from a //URI or mnemonic."""
    if not source:
        mnemonic = Keypair.generate_mnemonic(words=words)
        _show(Keypair.create_from_mnemonic(mnemonic, ss58_format=SS58), "generated", mnemonic)
        console.print("[yellow]Store the mnemonic securely — it controls the account.[/yellow]")
        return

    try:
        if source.strip().startswith("//") or "/" in source:
            _show(Keypair.create_from_uri(source, ss58_format=SS58), source)
        elif len(source.split()) >= 12:
            _show(Keypair.create_from_mnemonic(source, ss58_format=SS58), "from mnemonic")
        else:
            _show(Keypair.create_from_uri(source, ss58_format=SS58), source)
    except Exception as exc:  # noqa: BLE001
        console.print(f"[red]Could not parse key source: {exc}[/red]")
        raise typer.Exit(code=1)
