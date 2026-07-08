/**
 * `explain` command — name-only path is network-free and covers the
 * hero UX: `pdk-ts explain --name balances.InsufficientBalance` → KB
 * summary + fix steps, no node required.
 *
 * Module/error index resolution requires a live chain and is exercised
 * in the CI integration job.
 */

import {describe, it, expect} from 'vitest';
import {resolveByName} from '../src/commands/explain.js';

describe('explain --name (KB-only path)', () => {
  it('resolves balances.InsufficientBalance to a report with summary + steps', () => {
    const r = resolveByName('balances.InsufficientBalance');
    expect(r).not.toBeNull();
    expect(r?.palletName).toMatch(/balances/i);
    expect(r?.errorName).toBe('InsufficientBalance');
    expect(r?.summary).toMatch(/POT/);
    expect(r?.steps.length).toBeGreaterThan(0);
    expect(r?.kbEntry).toBe(true);
    // module/error indexes only known when we walk metadata
    expect(r?.palletIndex).toBe(-1);
    expect(r?.errorIndex).toBe(-1);
  });

  it('is case-insensitive on the lookup key', () => {
    const a = resolveByName('balances.InsufficientBalance');
    const b = resolveByName('BALANCES.INSUFFICIENTBALANCE');
    expect(a?.summary).toBe(b?.summary);
  });

  it('returns null for an unknown key', () => {
    const r = resolveByName('made_up.NotARealError');
    expect(r).toBeNull();
  });
});
