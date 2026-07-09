/**
 * KB ↔ Index consistency guard.
 *
 * Silent drift between the offline `error_index.json` and the curated
 * `error_fixes.yaml` is the class of bug that would erode trust the
 * fastest — user gets a WRONG error name back. These tests are the
 * canary.
 */

import {describe, it, expect} from 'vitest';
import {loadKb, loadIndex, kbSize, indexSize, INDEX_SPEC_NAME, INDEX_SPEC_VERSION, indexMatchesChain} from '../src/core/kb.js';

describe('KB / index consistency', () => {
  it('index and KB both load with non-trivial content', () => {
    expect(indexSize()).toBeGreaterThan(100);
    expect(kbSize()).toBeGreaterThan(10);
  });

  it('every KB key resolves to a valid pallet.Error shape', () => {
    for (const entry of loadKb().values()) {
      expect(entry.key).toMatch(/^[a-z][a-z0-9_]+\.[A-Z][A-Za-z0-9]*$/);
      expect(entry.summary.length).toBeGreaterThan(0);
      expect(entry.steps.length).toBeGreaterThan(0);
    }
  });

  it('all KB entries reference names present in the offline index (case-insensitive)', () => {
    const kb = loadKb();
    const index = loadIndex();
    const indexNames = new Set(Object.values(index).map((n) => n.toLowerCase()));
    const orphans: string[] = [];
    for (const entry of kb.values()) {
      // `dispatch.*` entries are top-level DispatchError variants, not
      // module errors — they legitimately live outside the index.
      if (entry.key.startsWith('dispatch.')) continue;
      if (!indexNames.has(entry.key.toLowerCase())) orphans.push(entry.key);
    }
    // If this ever fails, run extract_index.py against a fresh Portaldot
    // node and refresh error_index.json (or promote the entry to a
    // `dispatch.*` key if it's a top-level variant).
    expect(orphans, `KB entries with no matching index name: ${orphans.join(', ')}`).toEqual([]);
  });

  it('index fingerprint constants match the shipped file assumption', () => {
    expect(INDEX_SPEC_NAME).toBe('portaldot');
    expect(INDEX_SPEC_VERSION).toBeGreaterThanOrEqual(1002);
  });

  it('indexMatchesChain flags drift against a different spec', () => {
    // Positive: the compiled constants agree with themselves.
    expect(indexMatchesChain(INDEX_SPEC_NAME, INDEX_SPEC_VERSION)).toBe(true);
    // Negative: a different chain name → mismatch.
    expect(indexMatchesChain('polkadot', INDEX_SPEC_VERSION)).toBe(false);
    // Negative: same chain, different version → mismatch.
    expect(indexMatchesChain(INDEX_SPEC_NAME, INDEX_SPEC_VERSION + 1)).toBe(false);
  });
});
