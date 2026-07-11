import {describe, it, expect, beforeEach} from 'vitest';
import {loadKb, lookup, kbSize, kbPath, diffIndex} from '../src/core/kb.js';

describe('diffIndex (kb --verify logic)', () => {
  it('reports inSync for identical indexes', () => {
    const idx = {'6.2': 'Balances.InsufficientBalance', '0.0': 'System.InvalidSpecName'};
    const r = diffIndex(idx, {...idx});
    expect(r.inSync).toBe(true);
    expect(r.matches).toBe(2);
    expect(r.mismatches).toEqual([]);
  });

  it('flags a mismatch (same code, different name) with both names', () => {
    const r = diffIndex({'6.2': 'Balances.WrongName'}, {'6.2': 'Balances.InsufficientBalance'});
    expect(r.inSync).toBe(false);
    expect(r.matches).toBe(0);
    expect(r.mismatches).toEqual([{code: '6.2', shipped: 'Balances.WrongName', live: 'Balances.InsufficientBalance'}]);
  });

  it('flags missing (live has, shipped lacks) and stale (shipped has, live lacks)', () => {
    const r = diffIndex({'99.99': 'Fake.X'}, {'0.0': 'System.InvalidSpecName'});
    expect(r.missing).toEqual([{code: '0.0', live: 'System.InvalidSpecName'}]);
    expect(r.stale).toEqual([{code: '99.99', shipped: 'Fake.X'}]);
    expect(r.inSync).toBe(false);
  });

  it('counts only exact agreements as matches', () => {
    const shipped = {'6.2': 'Balances.InsufficientBalance', '6.3': 'Balances.WrongName', '1.0': 'Foo.Bar'};
    const live = {'6.2': 'Balances.InsufficientBalance', '6.3': 'Balances.RightName'};
    const r = diffIndex(shipped, live);
    expect(r.matches).toBe(1);
    expect(r.mismatches).toHaveLength(1);
    expect(r.stale).toHaveLength(1);
  });

  it('empty indexes are trivially in sync', () => {
    expect(diffIndex({}, {}).inSync).toBe(true);
  });
});

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
