"""`pdk keys` — generate or inspect a Substrate keypair (Portaldot SS58 format 42).

Portaldot ships `subkey`, but a built-in command keeps account creation inside
the same workflow — no separate tool, no context switch.
"""

from __future__ import annotations

import json as jsonlib

import typer
from rich.console import Console
from rich.table import Table
from substrateinterface import Keypair

from pdk.core.chain import detect_git_bash_mangling, normalise_account_uri

console = Console()
SS58 = 42  # Portaldot chain spec


def _readable_parse_error(exc: Exception, source: str) -> str:
    """Translate substrate-interface's internal exceptions into something
    a user can act on.

    ``Keypair.create_from_uri`` raises a bare ``AttributeError:
    'NoneType' object has no attribute 'groupdict'`` for malformed
    derivation URIs like ``//``, ``/``, or ``//Alice/`` — its regex
    match comes back None and the library calls .groupdict() on it
    without a guard. That is a substrate-interface internal detail, not
    something a pdk user should ever see.
    """
    msg = str(exc)
    if isinstance(exc, AttributeError) and "groupdict" in msg:
        return (
            f'"{source}" is not a valid derivation URI. '
            "Expected a form like //Alice, //Alice/soft, or //Alice//hard "
            "(each // segment is one derivation step)."
        )
    return msg


def _show(keypair: Keypair, label: str, mnemonic: str | None = None) -> None:
    table = Table(show_header=False, title=f"keypair — {label}")
    table.add_row("SS58 address", keypair.ss58_address)
    table.add_row("Public key", "0x" + keypair.public_key.hex())
    if mnemonic:
        table.add_row("Mnemonic", mnemonic)
    console.print(table)


def _emit_json(keypair: Keypair, label: str, mnemonic: str | None = None) -> None:
    payload = {
        "label": label,
        "ss58_address": keypair.ss58_address,
        "public_key": "0x" + keypair.public_key.hex(),
        "type": "sr25519",
    }
    if mnemonic:
        payload["mnemonic"] = mnemonic
    typer.echo(jsonlib.dumps(payload, indent=2))


def run(
    source: str = typer.Argument(
        None,
        help="A //URI (//Alice), bare name (Alice), or mnemonic to inspect. Omit to generate a new key.",
    ),
    words: int = typer.Option(12, "--words", help="Mnemonic word count when generating (12/15/18/21/24)."),
    json_out: bool = typer.Option(False, "--json", help="Emit machine-readable JSON (for scripts/seed fixtures)."),
) -> None:
    """Generate a fresh keypair, or inspect one from a //URI or mnemonic."""
    render = _emit_json if json_out else _show

    if not source:
        mnemonic = Keypair.generate_mnemonic(words=words)
        render(Keypair.create_from_mnemonic(mnemonic, ss58_format=SS58), "generated", mnemonic)
        if not json_out:
            console.print("[yellow]Store the mnemonic securely — it controls the account.[/yellow]")
        return

    normalised = normalise_account_uri(source)
    try:
        if normalised.startswith("//") or "/" in normalised:
            render(Keypair.create_from_uri(normalised, ss58_format=SS58), normalised)
        elif len(normalised.split()) >= 12:
            render(Keypair.create_from_mnemonic(normalised, ss58_format=SS58), "from mnemonic")
        else:
            render(Keypair.create_from_uri(normalised, ss58_format=SS58), normalised)
    except Exception as exc:  # noqa: BLE001
        msg = _readable_parse_error(exc, normalised)
        hint = detect_git_bash_mangling(source)
        if json_out:
            payload = {"error": msg}
            if hint:
                payload["hint"] = hint
            typer.echo(jsonlib.dumps(payload, indent=2))
        else:
            console.print(f"[red]Could not parse key source: {msg}[/red]")
            if hint:
                console.print(f"[yellow]  hint: {hint}[/yellow]")
        raise typer.Exit(code=1)
