/**
 * fund is a thin wrapper over send — the only thing worth locking without a
 * live node is the default amount constant it falls back to.
 */

import {describe, it, expect} from 'vitest';
import {DEFAULT_FUND_AMOUNT} from '../src/commands/fund.js';

describe('fund defaults', () => {
  it('has a positive default amount', () => {
    expect(Number(DEFAULT_FUND_AMOUNT)).toBeGreaterThan(0);
  });
});
