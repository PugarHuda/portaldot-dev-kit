"""`pdk debug` — FailLens: turn a cryptic failed transaction into a clear diagnosis."""

from __future__ import annotations

import json as jsonlib
import time

import typer
from rich.console import Console
from rich.panel import Panel

from pdk.config import DEFAULT_NODE_URL
from pdk.core.chain import connect, trigger_demo_failure
from pdk.core.decoder import (
    DecodedError,
    decode_receipt,
    failed_receipts_in_block,
    find_receipt,
)
from pdk.core.knowledge import FixSuggestion, load_knowledge, lookup_fix

console = Console()


def run(
    tx_hash: str = typer.Argument(None, help="Hash of the failed transaction to diagnose."),
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint."),
    demo: bool = typer.Option(False, "--demo", help="Trigger a failing transaction, then diagnose it."),
    watch: bool = typer.Option(False, "--watch", help="Live mode: decode every failed transaction as it lands."),
    json_out: bool = typer.Option(False, "--json", help="Emit the diagnosis as JSON (for scripts/CI)."),
    exit_code: bool = typer.Option(False, "--exit-code", help="Exit non-zero (2) when a failure is decoded — for CI pipeline gating."),
) -> None:
    """Diagnose a failed Portaldot transaction.

    Three modes: a single tx hash, `--demo` (submits its own failing tx, paying
    POT gas), or `--watch` (a live monitor that decodes failures as they happen).

    With `--json --exit-code`, pdk becomes a CI citizen: pipe a tx hash in, gate
    the build on the result.
    """
    if not (demo or watch) and not tx_hash:
        console.print("[red]Provide a transaction hash, or use --demo / --watch.[/red]")
        raise typer.Exit(code=1)

    try:
        substrate = connect(node)
    except Exception as exc:  # noqa: BLE001 — surface any connection failure plainly
        console.print(f"[red]Cannot reach a Portaldot node at {node}[/red]")
        console.print(f"[dim]{exc}[/dim]")
        console.print("Start one with [bold]pdk up[/bold] (inside WSL on Windows).")
        raise typer.Exit(code=1)

    if watch:
        _watch(substrate, json_out)
        return

    if demo:
        receipt = trigger_demo_failure(substrate)
        tx_hash = receipt.extrinsic_hash
        if not json_out:
            console.print(f"[dim]demo: submitted failing tx {tx_hash}[/dim]")
    else:
        receipt = find_receipt(substrate, tx_hash)
        if receipt is None:
            console.print(f"[yellow]No transaction {tx_hash} found in recent blocks.[/yellow]")
            console.print("[dim]FailLens scans only recent blocks — an older tx may be out of range.[/dim]")
            raise typer.Exit(code=1)

    decoded = decode_receipt(receipt)
    if decoded is None:
        if json_out:
            typer.echo(jsonlib.dumps({"tx": str(tx_hash), "success": True}))
        else:
            console.print("[green]That transaction succeeded — nothing to debug.[/green]")
        return

    fix = lookup_fix(decoded, load_knowledge())
    _emit(str(tx_hash), decoded, fix, json_out)
    if exit_code:
        # A failure was decoded — signal it so CI pipelines can gate on the result.
        raise typer.Exit(code=2)


def _watch(substrate, json_out: bool) -> None:
    """Poll for new blocks and diagnose every failed extrinsic as it appears."""
    kb = load_knowledge()
    last = substrate.get_block_number(substrate.get_chain_head())
    if not json_out:
        console.print(f"[dim]FailLens watching from block #{last} — Ctrl+C to stop.[/dim]")
    try:
        while True:
            head_num = substrate.get_block_number(substrate.get_chain_head())
            for number in range(last + 1, head_num + 1):
                block_hash = substrate.get_block_hash(number)
                for receipt in failed_receipts_in_block(substrate, block_hash):
                    decoded = decode_receipt(receipt)
                    if decoded is None:
                        continue
                    fix = lookup_fix(decoded, kb)
                    _emit(str(receipt.extrinsic_hash), decoded, fix, json_out)
            last = head_num
            time.sleep(2)
    except KeyboardInterrupt:
        if not json_out:
            console.print("\n[dim]stopped.[/dim]")


def _resolve_pallet(decoded: DecodedError, fix: FixSuggestion) -> str:
    """Recover the real pallet name.

    error_message reports a generic "Module" type for pallet errors, so prefer
    the pallet from the matched knowledge-base key when one is available.
    """
    return fix.matched_key.split(".")[0].title() if fix.matched_key else decoded.pallet


def _emit(tx_hash: str, decoded: DecodedError, fix: FixSuggestion, json_out: bool) -> None:
    """Render the diagnosis as a Rich panel, or as one JSON line when --json."""
    if json_out:
        typer.echo(
            jsonlib.dumps(
                {
                    "tx": tx_hash,
                    "pallet": _resolve_pallet(decoded, fix),
                    "error": decoded.name,
                    "known": fix.known,
                    "summary": fix.summary,
                    "fix": fix.steps,
                }
            )
        )
        return
    _render(tx_hash, decoded, fix)


def _render(tx_hash: str, decoded: DecodedError, fix: FixSuggestion) -> None:
    """Print the diagnosis: error -> explanation -> fix steps."""
    called = f"  [dim]· {decoded.extrinsic_call}[/dim]" if decoded.extrinsic_call else ""
    confidence = "" if fix.known else "  [yellow](no curated entry — metadata fallback)[/yellow]"
    pallet = _resolve_pallet(decoded, fix)
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
