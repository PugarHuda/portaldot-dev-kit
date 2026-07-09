/**
 * `explain` fast-path (offline index) behaviour tests.
 *
 * The `--module N --error M` flag goes through the offline `error_index.json`
 * before touching a node. These tests lock the shape of what happens when
 * the input is out-of-range, malformed, or lands on a known KB entry.
 */

import {describe, it, expect} from 'vitest';
import {indexLookup, indexSize} from '../src/core/kb.js';

describe('offline index (fast path)', () => {
  it('resolves the canonical 6.2 → Balances.InsufficientBalance', () => {
    // 6.2 is the hero example baked into the shipped index.
    const named = indexLookup(6, 2);
    expect(named).toBe('Balances.InsufficientBalance');
  });

  it('returns undefined for out-of-range pallet index (fast-path miss)', () => {
    expect(indexLookup(200, 0)).toBeUndefined();
    expect(indexLookup(255, 0)).toBeUndefined();
  });

  it('returns undefined for out-of-range error index within a real pallet', () => {
    // Balances has ~11 errors on Portaldot-1002; 250 is guaranteed off.
    expect(indexLookup(6, 250)).toBeUndefined();
  });

  it('is a total function — every index lookup returns string or undefined, never throws', () => {
    // Exercise a handful of corner values.
    for (const [m, e] of [
      [-1, 0],
      [0, -1],
      [Number.MAX_SAFE_INTEGER, 0],
      [0.5, 0.5],
    ]) {
      expect(() => indexLookup(m, e)).not.toThrow();
    }
  });

  it('has non-trivial size — sanity check the index actually loaded', () => {
    expect(indexSize()).toBeGreaterThan(100);
  });
});
