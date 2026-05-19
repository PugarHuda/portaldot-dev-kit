"""pdk — Portaldot Dev Kit CLI entry point.

Registers the three commands of the toolkit:
  pdk up      — bring a local Portaldot dev environment from zero to ready
  pdk debug   — FailLens: decode a failed transaction into a clear diagnosis
  pdk doctor  — check node version and environment health
"""

import typer

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


def main() -> None:
    """Console-script entry point."""
    app()


if __name__ == "__main__":
    main()
