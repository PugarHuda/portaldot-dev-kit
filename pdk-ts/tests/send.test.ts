/**
 * send's pure planck-conversion. The submit + outcome-detection path is
 * node-dependent and was verified end-to-end against a live node —
 * including the critical fix that a FAILED transfer (whose result events
 * @polkadot/api can't decode on Portaldot) reports `unconfirmed`, not a
 * false success.
 */

import {describe, it, expect} from 'vitest';
import {Keyring} from '@polkadot/api';
import {isPlainDecimalAmount, potToPlancks, resolveRecipient} from '../src/commands/send.js';

describe('isPlainDecimalAmount (guards potToPlancks against BigInt throws)', () => {
  it('accepts plain decimals', () => {
    for (const s of ['5', '2.3', '0.5', '1000', '0']) expect(isPlainDecimalAmount(s)).toBe(true);
  });
  it('rejects scientific notation, hex, signs, and junk', () => {
    // 1e3 passes Number.isFinite but BigInt("1e3") throws — must be rejected here.
    for (const s of ['1e3', '1E3', '0x10', '-5', '+5', 'abc', '', '1.2.3', 'Infinity', 'NaN']) {
      expect(isPlainDecimalAmount(s)).toBe(false);
    }
  });
});

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

describe('resolveRecipient (money-command strict)', () => {
  const keyring = new Keyring({type: 'sr25519', ss58Format: 42});

  it('derives an explicit //URI', () => {
    const bob = keyring.addFromUri('//Bob').address;
    expect(resolveRecipient(keyring, '//Bob')).toBe(bob);
  });

  it('passes a valid SS58 address through unchanged', () => {
    const addr = keyring.addFromUri('//Bob').address;
    expect(resolveRecipient(keyring, addr)).toBe(addr);
  });

  it('REJECTS a bare word — never silently derives + sends to a junk account', () => {
    // The bug this guards: `send NOTANADDRESS` used to derive //NOTANADDRESS
    // and move real POT into a black hole while reporting success.
    expect(() => resolveRecipient(keyring, 'NOTANADDRESS')).toThrow(/not a valid SS58 address or \/\/derivation/);
  });
});
