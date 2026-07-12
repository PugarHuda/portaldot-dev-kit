/**
 * watch's stream + per-block decode-degradation path is node-dependent and
 * was verified live. The one pure decision — the pallet filter — is locked
 * here (case-insensitive, absent filter passes everything).
 */

import {describe, it, expect} from 'vitest';
import {passesFilter} from '../src/commands/watch.js';

describe('watch pallet filter', () => {
  it('passes everything when no filter set', () => {
    expect(passesFilter('Balances')).toBe(true);
    expect(passesFilter('System')).toBe(true);
  });

  it('matches the named pallet case-insensitively', () => {
    expect(passesFilter('Balances', 'balances')).toBe(true);
    expect(passesFilter('Balances', 'BALANCES')).toBe(true);
    expect(passesFilter('System', 'balances')).toBe(false);
  });
});
