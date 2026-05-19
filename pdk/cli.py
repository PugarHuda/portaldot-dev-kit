"""pdk — Portaldot Dev Kit CLI entry point.

Registers the three commands of the toolkit:
  pdk up      — bring a local Portaldot dev environment from zero to ready
  pdk debug   — FailLens: decode a failed transaction into a clear diagnosis
  pdk doctor  — check node version and environment health
"""

import typer

from pdk import __version__
from pdk.commands import debug, doctor, up

app = typer.Typer(
    name="pdk",
    help="Portaldot Dev Kit — a developer toolkit for the Portaldot blockchain.",
    no_args_is_help=True,
    add_completion=False,
)

app.command("up", help="Start a local Portaldot node, fund dev accounts, verify.")(up.run)
app.command("debug", help="Decode a failed transaction into a human-readable diagnosis.")(debug.run)
app.command("doctor", help="Check node version and environment health.")(doctor.run)


def _version_callback(value: bool) -> None:
    if value:
        typer.echo(f"pdk {__version__}")
        raise typer.Exit()


@app.callback()
def _root(
    version: bool = typer.Option(
        False,
        "--version",
        help="Show the pdk version and exit.",
        callback=_version_callback,
        is_eager=True,
    ),
) -> None:
    """Portaldot Dev Kit — developer toolkit for the Portaldot blockchain."""


def main() -> None:
    """Console-script entry point."""
    app()


if __name__ == "__main__":
    main()
