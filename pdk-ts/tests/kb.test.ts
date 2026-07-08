import {describe, it, expect, beforeEach} from 'vitest';
import {loadKb, lookup, kbSize, kbPath} from '../src/core/kb.js';

describe('shared KB parser', () => {
  beforeEach(() => {
    delete process.env.PDK_KB_PATH;
    // Re-load fresh in case a previous test cached a different path.
    loadKb(/* force */ true);
  });

  it('loads Python pdk error_fixes.yaml from the sibling directory', () => {
    const path = kbPath();
    expect(path).toBeTruthy();
    expect(path).toMatch(/error_fixes\.yaml$/);
  });

  it('resolves at least the well-known balances.InsufficientBalance entry', () => {
    const entry = lookup('balances.InsufficientBalance');
    expect(entry).toBeDefined();
    expect(entry?.summary).toMatch(/POT/);
    expect(entry?.steps.length).toBeGreaterThan(0);
  });

  it('is case-insensitive on the pallet.name lookup', () => {
    const a = lookup('balances.InsufficientBalance');
    const b = lookup('BALANCES.INSUFFICIENTBALANCE');
    expect(a?.summary).toBe(b?.summary);
  });

  it('reports a non-trivial KB size', () => {
    // Python pdk maintains ~29 curated entries verified against
    // portaldot-1002; use a low floor so this test is stable while the
    // KB grows.
    expect(kbSize()).toBeGreaterThan(10);
  });
});
