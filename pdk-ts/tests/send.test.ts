/**
 * send's pure planck-conversion. The submit + outcome-detection path is
 * node-dependent and was verified end-to-end against a live node —
 * including the critical fix that a FAILED transfer (whose result events
 * @polkadot/api can't decode on Portaldot) reports `unconfirmed`, not a
 * false success.
 */

import {describe, it, expect} from 'vitest';
import {Keyring} from '@polkadot/api';
import {potToPlancks, resolveRecipient} from '../src/commands/send.js';

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
