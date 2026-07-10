/**
 * Balance formatting must use Portaldot's real 14 decimals, not the
 * generic Substrate default of 12. Getting this wrong displays every
 * balance 100x off and disagrees with the Python `pdk accounts` output
 * against the same node. These tests lock the scale.
 */

import {describe, it, expect} from 'vitest';
import {formatBalance} from '../src/commands/accounts.js';

describe('formatBalance', () => {
  it('defaults to 14 decimals (verified Portaldot POT scale, not the Substrate 12 default)', () => {
    // 1 POT = 10^14 plancks. With the old buggy 12-decimal assumption
    // this same raw value would have printed "100.0000 POT".
    expect(formatBalance('100000000000000')).toBe('1.0000 POT');
  });

  it('scales a large balance correctly with comma separators on every locale', () => {
    // 1,000,000 POT = 10^6 * 10^14 plancks. The en-US locale is pinned
    // in formatBalance so this is a comma on a de-DE machine too.
    expect(formatBalance('100000000000000000000')).toBe('1,000,000.0000 POT');
  });

  it('keeps 4 fractional digits', () => {
    // 1.2345 POT = 1.2345 * 10^14 = 123450000000000 plancks.
    expect(formatBalance('123450000000000')).toBe('1.2345 POT');
  });

  it('renders zero specially', () => {
    expect(formatBalance('0')).toBe('0 POT');
  });

  it('honors an explicit decimals argument (used when a chain declares its own)', () => {
    // collectAccounts passes the chain's declared tokenDecimals when
    // present (e.g. Polkadot's 10); Portaldot declares none, so 14 is used.
    expect(formatBalance('1000000000000', 12)).toBe('1.0000 POT');
  });

  it('a 14-decimal chain and a 12-decimal reading of the same raw differ by 100x', () => {
    const raw = '100000000000000'; // 1 POT at 14 decimals
    expect(formatBalance(raw, 14)).toBe('1.0000 POT');
    expect(formatBalance(raw, 12)).toBe('100.0000 POT');
  });
});
