"""`pdk ai-setup` — first-run wizard for the optional AI layer.

Walks a developer through getting a (free) OpenRouter key, testing it against
the configured base/model, and printing the exact export command for their
shell. Removes the friction of "where do I even put the key" without forcing
anyone to read documentation.
"""

from __future__ import annotations

import os
import platform

import typer
from rich.console import Console
from rich.panel import Panel

from pdk.core.ai import ai_complete, ai_status

console = Console()

_SIGNUP_URL = "https://openrouter.ai/keys"


def run(
    test_only: bool = typer.Option(False, "--test", help="Only test the current PDK_AI_KEY; skip the setup walkthrough."),
) -> None:
    """Set up (or just verify) the optional AI diagnosis layer."""
    status = ai_status()
    _print_status_panel(status)

    if status["configured"]:
        ok = _test_key(status)
        if ok:
            console.print("[green]✓ AI is configured and reachable.[/green] "
                          "Every [bold]pdk debug[/bold] / [bold]explain[/bold] "
                          "/ [bold]simulate[/bold] / [bold]report[/bold] will "
                          "auto-include an AI section. Opt out per-command "
                          "with [bold]--no-ai[/bold].")
        else:
            console.print("[yellow]A key is set but the test call failed.[/yellow]")
            console.print("Common causes: the key was revoked, the model in "
                          f"[bold]PDK_AI_MODEL[/bold] is unavailable, or your "
                          "network blocks [bold]openrouter.ai[/bold].")
        if test_only:
            return
        console.print("[dim]Re-running setup will re-print the export commands "
                      "in case you want to install the key in another shell.[/dim]\n")

    if test_only:
        console.print("[red]No key set — nothing to test.[/red] "
                      "Run [bold]pdk ai-setup[/bold] (without --test) for the walkthrough.")
        raise typer.Exit(code=1)

    _walkthrough()


def _print_status_panel(status: dict) -> None:
    """Render a short config snapshot. Mirrors the row shown by `pdk doctor`."""
    if status["configured"]:
        body = (
            f"[green]configured[/green]\n"
            f"key      : {status['key_preview']}\n"
            f"model    : {status['model']}\n"
            f"endpoint : {status['base']}"
        )
    else:
        body = (
            "[yellow]not configured[/yellow]\n"
            "pdk works without AI - this layer only adds an [bold]AI-suggested[/bold] "
            "second opinion next to the verified knowledge-base entry."
        )
    console.print(Panel(body, title="pdk ai-setup - current state", border_style="cyan"))


def _test_key(status: dict) -> bool:
    """Send the smallest possible chat completion to verify reachability."""
    console.print(f"[dim]testing {status['model']} via {status['base']} ...[/dim]")
    reply = ai_complete(
        system="Reply with just the word OK.",
        user="Are you reachable?",
        max_tokens=8,
    )
    return bool(reply)


def _walkthrough() -> None:
    """Print numbered steps + the exact export command for the user's shell."""
    console.print("[bold]Two steps to enable AI:[/bold]")
    console.print(f"  1. Open [cyan]{_SIGNUP_URL}[/cyan] and create a free API key.")
    console.print("     OpenRouter's free tier covers our default model "
                  "([bold]openai/gpt-oss-120b:free[/bold]) - no credit card.")
    console.print("  2. Set the key in your shell. Pick the one that matches your OS:")
    console.print()
    shell_hint = _detect_shell()
    if shell_hint == "powershell":
        console.print('[bold cyan]    # Windows PowerShell (current session)[/bold cyan]')
        console.print('    $env:PDK_AI_KEY = "sk-or-v1-..."')
        console.print('[bold cyan]    # Persistent across sessions[/bold cyan]')
        console.print('    [System.Environment]::SetEnvironmentVariable("PDK_AI_KEY", "sk-or-v1-...", "User")')
    else:
        console.print('[bold cyan]    # Linux / macOS / WSL (bash, zsh)[/bold cyan]')
        console.print('    export PDK_AI_KEY="sk-or-v1-..."')
        console.print("    # Make it persistent by adding the line to ~/.bashrc or ~/.zshrc")
    console.print()
    console.print("Optional overrides (only if you don't want the OpenRouter default):")
    console.print("  [dim]PDK_AI_MODEL[/dim]    swap the model (e.g. z-ai/glm-4.5-air:free)")
    console.print("  [dim]PDK_AI_BASE_URL[/dim] swap the endpoint (any OpenAI-compatible URL)")
    console.print()
    console.print("Verify with: [bold]pdk ai-setup --test[/bold]")


def _detect_shell() -> str:
    """Best-effort: is this user on PowerShell or a POSIX shell? Returns
    'powershell' or 'posix'. Used only to pick which copy-paste hint to show."""
    if platform.system() == "Windows" and not os.environ.get("WSL_DISTRO_NAME"):
        # PSModulePath is set only inside PowerShell; cmd.exe doesn't define it.
        if os.environ.get("PSModulePath"):
            return "powershell"
        return "powershell"  # default Windows users to PS hints
    return "posix"
