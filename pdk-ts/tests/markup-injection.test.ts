/**
 * `stripControlChars` regression tests — the TS-side counterpart to
 * Python's decoder.strip_control_chars sweep (see pdk's
 * test_markup_injection.py). picocolors never parses `[tag]`-style
 * markup from string content (unlike Rich), so pdk-ts has no
 * equivalent of the Rich markup-injection class — but it also never
 * filtered raw ANSI/OSC escape sequences, which many real terminals
 * (Windows Terminal, iTerm2, kitty, VS Code) render natively as
 * clickable hyperlinks, independent of any styling library.
 */

import {describe, it, expect} from 'vitest';
import {stripControlChars} from '../src/core/errors.js';

const OSC8_PAYLOAD = 'safe text \x1b]8;;https://evil.example\x07click here\x1b]8;;\x07 end';

describe('stripControlChars', () => {
  it('removes ESC and BEL bytes from a raw OSC 8 hyperlink escape sequence', () => {
    const result = stripControlChars(OSC8_PAYLOAD);
    expect(result).not.toContain('\x1b');
    expect(result).not.toContain('\x07');
    expect(result).toContain('safe text');
    expect(result).toContain('click here');
  });

  it('preserves tab and newline', () => {
    expect(stripControlChars('a\tb\nc')).toBe('a\tb\nc');
  });

  it('strips the full C0 control range plus DEL', () => {
    const allControlExceptTabNewline = Array.from({length: 0x20}, (_, i) => i)
      .filter((c) => c !== 0x09 && c !== 0x0a)
      .map((c) => String.fromCharCode(c))
      .join('');
    expect(stripControlChars(`${allControlExceptTabNewline}\x7f`)).toBe('');
  });

  it('leaves normal text completely untouched', () => {
    const text = 'Balances.InsufficientBalance — fund the account first.';
    expect(stripControlChars(text)).toBe(text);
  });

  it('verifies picocolors itself does NOT filter these bytes (the reason this function exists)', async () => {
    const pc = (await import('picocolors')).default;
    const wrapped = pc.dim(OSC8_PAYLOAD);
    expect(wrapped).toContain('\x1b]8'); // confirms the gap this function closes
  });
});
