"""``pdk kb`` — knowledge base introspection.

Feature parity with ``pdk-ts kb`` (introduced in pdk-ts alpha.2). Three
modes:

- ``pdk kb`` — summary: KB entries + index entries + coverage %
- ``pdk kb --missing`` — list index entries that DON'T have a curated fix
                        (the 5-line YAML PR shortlist for contributors)
- ``pdk kb --list`` — dump every curated entry

Fully offline — never touches a node. Reads the same
``pdk/data/error_fixes.yaml`` + ``pdk/data/error_index.json`` files that
FailLens uses at runtime.
"""

from __future__ import annotations

import json as _json
from pathlib import Path

import typer
from rich.console import Console
from rich.markup import escape
from rich.table import Table

from pdk.config import DEFAULT_NODE_URL
from pdk.core.chain import connect
from pdk.core.knowledge import _kb_path as _resolved_kb_path
from pdk.core.knowledge import build_live_index, diff_index, load_error_index, load_knowledge

console = Console()

_INDEX_SPEC_NAME = "portaldot"
_INDEX_SPEC_VERSION = 1002


def _kb_path() -> Path:
    # Delegate to knowledge.py so the DISPLAYED path reflects the same
    # PDK_KB_PATH env override that load_knowledge() actually reads —
    # otherwise `pdk kb` would show the bundled default while silently
    # loading from the override (or vice-versa).
    return _resolved_kb_path()


def _index_drift() -> tuple[bool, str | None]:
    """Cross-check sidecar meta against compiled-in constants.

    Mirrors pdk-ts ``indexDrift()`` so both CLIs report the same drift signal.
    """
    meta_path = Path(__file__).resolve().parent.parent / "data" / "error_index.meta.json"
    if not meta_path.exists():
        return False, None
    try:
        with meta_path.open(encoding="utf-8") as fh:
            meta = _json.load(fh)
    except (OSError, ValueError):
        return False, None
    s = (meta.get("specName") or "").lower()
    v = meta.get("specVersion")
    if not isinstance(v, int) or not s:
        return False, None
    if s == _INDEX_SPEC_NAME and v == _INDEX_SPEC_VERSION:
        return False, None
    return True, f"sidecar reports {s}-{v}, code constants say {_INDEX_SPEC_NAME}-{_INDEX_SPEC_VERSION}"


def _missing_entries() -> list[tuple[str, str]]:
    """Return ``(code, name)`` pairs for index entries without a KB fix.

    Sorted alphabetically by name to match pdk-ts's deterministic output.
    """
    kb = load_knowledge()
    kb_keys = {k.lower() for k in kb}
    index = load_error_index()
    missing: list[tuple[str, str]] = []
    for code, name in index.items():
        if name.lower() not in kb_keys:
            missing.append((code, name))
    missing.sort(key=lambda p: p[1].lower())
    return missing


def run(
    missing: bool = typer.Option(False, "--missing", help="list index entries without a curated fix"),
    list_all: bool = typer.Option(False, "--list", help="list every curated KB entry"),
    verify: bool = typer.Option(False, "--verify", help="check the offline index against a live node's metadata (needs --node)."),
    node: str = typer.Option(DEFAULT_NODE_URL, "--node", help="Portaldot node WS endpoint (for --verify)."),
    json: bool = typer.Option(False, "--json", help="emit machine-readable JSON"),
) -> None:
    """Knowledge base introspection — coverage, missing entries, full list, or live index verification."""
    kb = load_knowledge()
    index = load_error_index()
    kb_entries = len(kb)
    index_entries = len(index)
    coverage = round(kb_entries / index_entries * 100, 1) if index_entries else 0.0
    drift, drift_reason = _index_drift()

    if verify:
        _verify_index(index, node, json)
        return
    if missing:
        _report_missing(json)
        return
    if list_all:
        _report_list(kb, json)
        return

    if json:
        typer.echo(
            _json.dumps(
                {
                    "schemaVersion": 1,
                    "kbPath": str(_kb_path()),
                    "kbEntries": kb_entries,
                    "indexEntries": index_entries,
                    "indexFingerprint": {"specName": _INDEX_SPEC_NAME, "specVersion": _INDEX_SPEC_VERSION},
                    "driftDetected": drift,
                    "driftReason": drift_reason,
                    "coveragePercent": coverage,
                },
                indent=2,
            )
        )
        return

    console.print()
    console.print("[bold]  pdk kb[/bold]")
    console.print()
    console.print(f"  [dim]KB path        [/dim]  {_kb_path()}")
    console.print(f"  [dim]KB entries     [/dim]  [green]{kb_entries}[/green]")
    console.print(
        f"  [dim]Index entries  [/dim]  {index_entries}  [dim]({_INDEX_SPEC_NAME}-{_INDEX_SPEC_VERSION})[/dim]"
    )
    console.print(f"  [dim]KB coverage    [/dim]  [cyan]{coverage}%[/cyan]")
    if drift:
        console.print(f"  [yellow]drift          [/yellow]  [yellow]{drift_reason}[/yellow]")
    console.print()
    console.print("[dim]  Subcommands:[/dim]")
    console.print(f"  [dim]  --missing[/dim]  list the {index_entries - kb_entries} errors without a curated fix")
    console.print("  [dim]  --list   [/dim]  list every curated entry")
    console.print("  [dim]  --verify [/dim]  check the offline index against a live node (--node)")
    console.print()


def _verify_index(shipped: dict, node: str, as_json: bool) -> None:
    """Diff the shipped offline index against a live node's metadata.

    The offline fast-path (`explain --module N --error M`) is only as
    correct as the bundled index. After a runtime upgrade the pallet/error
    layout can shift; this walks the live metadata and reports whether the
    shipped index still matches — exit 1 (and non-empty diff) if it drifted.
    """
    try:
        substrate = connect(node)
        substrate.init_runtime()  # metadata is lazy; --verify needs it loaded
    except Exception as exc:  # noqa: BLE001
        msg = f"Cannot reach a Portaldot node at {node}"
        if as_json:
            typer.echo(_json.dumps({"error": msg, "detail": str(exc)}))
        else:
            console.print(f"[red]{msg}[/red]")
            console.print(f"[dim]{escape(str(exc))}[/dim]")
        raise typer.Exit(code=1)

    live = build_live_index(substrate)
    report = diff_index(shipped, live)

    if as_json:
        typer.echo(_json.dumps({
            "schemaVersion": 1,
            "endpoint": node,
            "shippedEntries": len(shipped),
            "liveEntries": len(live),
            **report,
        }, indent=2))
        raise typer.Exit(code=0 if report["inSync"] else 1)

    console.print()
    console.print("[bold]  pdk kb --verify[/bold]  " + f"[dim]({escape(node)})[/dim]")
    console.print()
    console.print(f"  [dim]shipped index  [/dim]  {len(shipped)} entries")
    console.print(f"  [dim]live metadata  [/dim]  {len(live)} entries")
    console.print(f"  [dim]matching       [/dim]  [green]{report['matches']}[/green]")
    if report["inSync"]:
        console.print()
        console.print("  [green]✓ the offline index exactly matches this chain's runtime metadata.[/green]")
        console.print()
        return

    # Drift — show the actionable detail. Mismatches are the dangerous
    # kind (fast path returns a wrong name), so surface them first.
    for m in report["mismatches"][:20]:
        console.print(f"  [red]MISMATCH[/red]  {m['code']}  shipped=[yellow]{escape(m['shipped'])}[/yellow]  live=[cyan]{escape(m['live'])}[/cyan]")
    for m in report["missing"][:20]:
        console.print(f"  [yellow]MISSING [/yellow]  {m['code']}  live=[cyan]{escape(m['live'])}[/cyan] [dim](not in shipped index)[/dim]")
    for s in report["stale"][:20]:
        console.print(f"  [yellow]STALE   [/yellow]  {s['code']}  shipped=[yellow]{escape(s['shipped'])}[/yellow] [dim](not on live chain)[/dim]")
    console.print()
    console.print("  [dim]Regenerate: python extract_index.py > pdk/data/error_index.json[/dim]")
    console.print()
    raise typer.Exit(code=1)


def _report_missing(as_json: bool) -> None:
    entries = _missing_entries()
    if as_json:
        typer.echo(
            _json.dumps(
                {
                    "schemaVersion": 1,
                    "count": len(entries),
                    "entries": [
                        {
                            "code": code,
                            "name": name,
                            "palletIndex": int(code.split(".")[0]),
                            "errorIndex": int(code.split(".")[1]),
                        }
                        for code, name in entries
                    ],
                },
                indent=2,
            )
        )
        return

    console.print()
    console.print(
        f"[bold]  {len(entries)} errors without a curated fix[/bold]"
        f"  [dim](of {len(load_error_index())} total in the {_INDEX_SPEC_NAME}-{_INDEX_SPEC_VERSION} index)[/dim]"
    )
    console.print("[dim]  Each entry is a 5-line YAML PR opportunity. See CONTRIBUTING.md.[/dim]")
    console.print()
    for code, name in entries[:40]:
        console.print(f"  [dim]{code:<8}[/dim]  [cyan]{name}[/cyan]")
    if len(entries) > 40:
        console.print(f"\n  [dim]... and {len(entries) - 40} more. Use --json to get them all.[/dim]")
    console.print()


def _report_list(kb: dict[str, dict], as_json: bool) -> None:
    ordered = sorted(kb.items(), key=lambda kv: kv[0].lower())
    if as_json:
        payload = [
            {
                "key": key,
                "summary": (entry or {}).get("summary", ""),
                "steps": (entry or {}).get("steps", []),
            }
            for key, entry in ordered
        ]
        typer.echo(_json.dumps({"schemaVersion": 1, "count": len(payload), "entries": payload}, indent=2))
        return

    console.print()
    console.print(f"[bold]  {len(ordered)} curated KB entries[/bold]  [dim](path: {_kb_path()})[/dim]")
    console.print()
    for key, entry in ordered:
        entry = entry or {}
        console.print(f"  [cyan]{key}[/cyan]")
        summary = entry.get("summary", "").strip()
        if summary:
            console.print(f"    [dim]{summary}[/dim]")
    console.print()
