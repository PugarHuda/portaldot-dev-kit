/**
 * simulate's pure prediction + planck-conversion logic — the
 * correctness-critical parts (the fee/balance query is node-dependent
 * and verified live). predictOutcome mirrors Python's predict_outcome
 * exactly, including the existential-deposit / keep-alive rule.
 */

import {describe, it, expect} from 'vitest';
import {predictOutcome, potToPlancks} from '../src/commands/simulate.js';

const ED = 1.0;

describe('predictOutcome', () => {
  it('normal transfer with headroom → SUCCEED', () => {
    expect(predictOutcome(10, 0.01, 100, ED)).toEqual({feasible: true, likelyError: ''});
  });

  it('draining below the existential deposit → KeepAlive (not SUCCEED)', () => {
    // 99 + 1 fee = 100, leaves 0 < ED. transferKeepAlive would fail.
    expect(predictOutcome(99, 1.0, 100, ED)).toEqual({feasible: false, likelyError: 'Balances.KeepAlive'});
  });

  it('leaving exactly ED behind → SUCCEED', () => {
    expect(predictOutcome(98, 1.0, 100, ED).feasible).toBe(true);
  });

  it('amount + fee over balance → InsufficientBalance', () => {
    expect(predictOutcome(200, 0.01, 100, ED)).toEqual({feasible: false, likelyError: 'Balances.InsufficientBalance'});
  });

  it('ED=0 reduces to a plain balance check', () => {
    expect(predictOutcome(99, 1.0, 100, 0).feasible).toBe(true);
  });
});

describe('potToPlancks (14 decimals, exact)', () => {
  it('whole numbers', () => {
    expect(potToPlancks('1')).toBe(100000000000000n);
    expect(potToPlancks('3')).toBe(300000000000000n);
  });

  it('fractional POT exactly (no float drift)', () => {
    expect(potToPlancks('2.3')).toBe(230000000000000n);
    expect(potToPlancks('0.7')).toBe(70000000000000n);
  });

  it('truncates beyond 14 decimals', () => {
    expect(potToPlancks('0.000000000000001')).toBe(0n); // 1e-15 < 1 planck
  });

  it('zero', () => {
    expect(potToPlancks('0')).toBe(0n);
  });
});
