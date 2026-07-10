"""Regression tests for the Rich-markup / terminal-escape injection sweep.

Threat model: pdk connects to any --node URL a user provides. A genuine
Rust-compiled chain constrains identifiers to
`[a-zA-Z_][a-zA-Z0-9_]*`, but doc comments and storage/event payloads
are free-form text with no such restriction — and nothing stops a
malicious/fake RPC server from forging even the "constrained" fields.
These tests run the real command entry points (`storage.run`,
`pallets.run`, `watch.run`) against mocked chain objects returning
malicious payloads, and assert the injected markup/escape sequences
never reach the console un-neutralized.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from typer.testing import CliRunner

from pdk.commands import pallets as pallets_module
from pdk.commands import storage as storage_module
from pdk.commands import watch as watch_module

runner = CliRunner()

MALICIOUS_LINK = "[link=https://evil.example/drain]Click here[/link]"
OSC8_PAYLOAD = "safe text \x1b]8;;https://evil.example\x07click\x1b]8;;\x07 end"


def _capture(monkeypatch, fn, *args, **kwargs) -> str:
    """Run fn and capture what it actually handed to Console.print, as
    rendered plain text (Rich strips styling but keeps literal
    characters — exactly what we need to assert on)."""
    from rich.console import Console

    printed: list[str] = []
    real_console = Console(record=True, width=200)
    monkeypatch.setattr(fn.__module__ + ".console", real_console, raising=False)
    fn(*args, **kwargs)
    return real_console.export_text()


class TestStorageValueEscaping:
    def test_malicious_string_value_renders_literally(self, monkeypatch) -> None:
        fake_result = MagicMock()
        fake_result.value = MALICIOUS_LINK
        fake_substrate = MagicMock()
        fake_substrate.query.return_value = fake_result

        with patch.object(storage_module, "connect", return_value=fake_substrate):
            out = _capture(monkeypatch, storage_module.run, pallet="Identity", item="IdentityOf", keys=[], node="ws://fake")

        assert "[link=" in out  # printed literally, not parsed
        assert "Click here" in out

    def test_osc8_escape_sequence_stripped(self, monkeypatch) -> None:
        fake_result = MagicMock()
        fake_result.value = OSC8_PAYLOAD
        fake_substrate = MagicMock()
        fake_substrate.query.return_value = fake_result

        with patch.object(storage_module, "connect", return_value=fake_substrate):
            out = _capture(monkeypatch, storage_module.run, pallet="System", item="Remark", keys=[], node="ws://fake")

        assert "\x1b" not in out
        assert "\x07" not in out

    def test_dict_value_unaffected_by_the_fix(self, monkeypatch) -> None:
        # Structured values must keep working exactly as before.
        fake_result = MagicMock()
        fake_result.value = {"free": 100, "reserved": 0}
        fake_substrate = MagicMock()
        fake_substrate.query.return_value = fake_result

        with patch.object(storage_module, "connect", return_value=fake_substrate):
            out = _capture(monkeypatch, storage_module.run, pallet="System", item="Account", keys=[], node="ws://fake")

        assert "100" in out


class TestPalletsNameEscaping:
    def test_pallet_list_escapes_forged_pallet_name(self, monkeypatch) -> None:
        fake_pallet = MagicMock()
        fake_pallet.name = MALICIOUS_LINK
        fake_pallet.calls = []
        fake_pallet.events = []
        fake_pallet.errors = []
        fake_substrate = MagicMock()
        fake_substrate.metadata.pallets = [fake_pallet]

        with patch.object(pallets_module, "connect", return_value=fake_substrate):
            out = _capture(monkeypatch, pallets_module.run, pallet=None, node="ws://fake")

        assert "[link=" in out

    def test_error_docs_control_chars_stripped_and_markup_escaped(self, monkeypatch) -> None:
        fake_error = MagicMock()
        fake_error.name = "SomeError"
        fake_error.docs = [f"bad {OSC8_PAYLOAD} {MALICIOUS_LINK}"]
        fake_pallet = MagicMock()
        fake_pallet.name = "RealPallet"
        fake_pallet.calls = []
        fake_pallet.errors = [fake_error]
        fake_substrate = MagicMock()
        fake_substrate.metadata.pallets = [fake_pallet]

        with patch.object(pallets_module, "connect", return_value=fake_substrate):
            out = _capture(monkeypatch, pallets_module.run, pallet="RealPallet", node="ws://fake")

        assert "\x1b" not in out
        assert "[link=" in out  # literal, not a real hyperlink


class TestWatchAttributeIsolation:
    def test_remark_style_attributes_never_reach_a_markup_parsed_string(self, monkeypatch) -> None:
        fake_event = MagicMock()
        fake_event.value = {
            "module_id": "System",
            "event_id": "Remarked",
            "attributes": {"remark": MALICIOUS_LINK},
        }
        fake_substrate = MagicMock()
        fake_substrate.get_block_number.side_effect = [100, 101, 101]
        fake_substrate.get_block_hash.return_value = "0xabc"
        fake_substrate.get_events.return_value = [fake_event]

        with patch.object(watch_module, "connect", return_value=fake_substrate), \
             patch.object(watch_module.time, "sleep", side_effect=KeyboardInterrupt):
            out = _capture(monkeypatch, watch_module.run, pallet=None, node="ws://fake")

        assert "[link=" in out
