/**
 * debug's tx-scan + decode-wall degradation is node-dependent and was
 * verified live. The one thing worth locking here: the demo's expected
 * error label must resolve to a real curated KB entry — otherwise
 * `debug --demo` would show an empty diagnosis on the (Portaldot) path
 * where the live event can't be decoded.
 */

import {describe, it, expect} from 'vitest';
import {DEMO_EXPECTED_ERROR} from '../src/commands/debug.js';
import {resolveByName} from '../src/commands/explain.js';

describe('debug demo label', () => {
  it('resolves to a curated KB entry with a summary and fix steps', () => {
    const report = resolveByName(DEMO_EXPECTED_ERROR);
    expect(report).not.toBeNull();
    expect(report?.kbEntry).toBe(true);
    expect(report?.summary).toBeTruthy();
    expect(report?.steps.length).toBeGreaterThan(0);
  });
});
