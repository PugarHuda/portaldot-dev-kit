/**
 * send's pure planck-conversion. The submit + outcome-detection path is
 * node-dependent and was verified end-to-end against a live node —
 * including the critical fix that a FAILED transfer (whose result events
 * @polkadot/api can't decode on Portaldot) reports `unconfirmed`, not a
 * false success.
 */

import {describe, it, expect} from 'vitest';
import {potToPlancks} from '../src/commands/send.js';

describe('send potToPlancks (14 decimals, exact)', () => {
  it('whole POT', () => {
    expect(potToPlancks('5')).toBe(500000000000000n);
  });

  it('fractional POT exactly', () => {
    expect(potToPlancks('2.3')).toBe(230000000000000n);
    expect(potToPlancks('0.5')).toBe(50000000000000n);
  });

  it('truncates sub-planck', () => {
    expect(potToPlancks('0.000000000000001')).toBe(0n);
  });
});
