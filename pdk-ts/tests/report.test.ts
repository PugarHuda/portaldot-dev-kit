/**
 * `report`'s pure assembly logic — ordering + shape. The block-scanning
 * itself (collectFailures) is node-dependent and verified end-to-end
 * against a live node (both a chain @polkadot/api decodes cleanly, and
 * Portaldot where it gracefully skips undecodable blocks).
 */

import {describe, it, expect} from 'vitest';
import {buildReport} from '../src/commands/report.js';

describe('buildReport', () => {
  it('orders by_error most-frequent-first', () => {
    const counts = new Map([
      ['Balances.InsufficientBalance', 2],
      ['System.BadOrigin', 5],
      ['Assets.NoPermission', 1],
    ]);
    const r = buildReport(counts, 30, 8, 0);
    expect(r.by_error.map((e) => e.error)).toEqual([
      'System.BadOrigin',
      'Balances.InsufficientBalance',
      'Assets.NoPermission',
    ]);
  });

  it('breaks count ties alphabetically (matches Python summarize)', () => {
    const counts = new Map([
      ['Zebra.Err', 2],
      ['Alpha.Err', 2],
    ]);
    const r = buildReport(counts, 10, 4, 0);
    expect(r.by_error.map((e) => e.error)).toEqual(['Alpha.Err', 'Zebra.Err']);
  });

  it('omits blocks_undecodable when zero (core shape matches Python)', () => {
    const r = buildReport(new Map(), 20, 0, 0);
    expect(r).toEqual({blocks_scanned: 20, total_failures: 0, by_error: []});
    expect('blocks_undecodable' in r).toBe(false);
  });

  it('includes blocks_undecodable when some blocks could not be decoded', () => {
    const r = buildReport(new Map([['X.Y', 1]]), 10, 1, 3);
    expect(r.blocks_undecodable).toBe(3);
    expect(r.blocks_scanned).toBe(10);
  });
});
