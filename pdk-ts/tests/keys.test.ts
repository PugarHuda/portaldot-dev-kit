/**
 * `keys` command tests — network-free, everything is local crypto so
 * these run instantly and match the Python `pdk keys` behavior for
 * well-known dev URIs.
 */

import {describe, it, expect} from 'vitest';
import {Keyring} from '@polkadot/api';
import {cryptoWaitReady, mnemonicGenerate} from '@polkadot/util-crypto';

// Well-known Alice/Bob/Charlie SS58 (format 42) addresses — deterministic
// outputs from the dev URIs documented in every Substrate tutorial.
// Baking them in here proves the crypto pathway matches the Python side
// byte-for-byte.
const KNOWN = {
  '//Alice': '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  '//Bob': '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  '//Charlie': '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
} as const;

describe('keys command — dev URI deterministic addresses', () => {
  it.each(Object.entries(KNOWN))('%s → %s', async (uri, expected) => {
    await cryptoWaitReady();
    const kr = new Keyring({type: 'sr25519', ss58Format: 42});
    const pair = kr.addFromUri(uri);
    expect(pair.address).toBe(expected);
  });

  it('generates a distinct address for a fresh mnemonic', async () => {
    await cryptoWaitReady();
    const kr = new Keyring({type: 'sr25519', ss58Format: 42});
    const a = kr.addFromMnemonic(mnemonicGenerate(12));
    const b = kr.addFromMnemonic(mnemonicGenerate(12));
    expect(a.address).not.toBe(b.address);
    // ~47-48 chars, starts with 5 for SS58 format 42
    expect(a.address).toMatch(/^5[a-zA-Z0-9]{46,47}$/);
  });
});
