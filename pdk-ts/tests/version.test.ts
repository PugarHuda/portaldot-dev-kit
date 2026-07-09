/**
 * Lock the shape of `pdk-ts version --json`. Consumers script against
 * this — any breaking rename of a top-level key is a semver-major.
 */

import {describe, it, expect} from 'vitest';
import {VERSION} from '../src/core/config.js';

describe('VERSION constant', () => {
  it('is a semver 0.2.0-alpha.N string, not the empty string', () => {
    expect(VERSION).toMatch(/^0\.\d+\.\d+(-[a-z0-9.]+)?$/i);
  });
});

describe('library public surface', () => {
  // First-time @polkadot/api import warms the graph and can exceed the
  // vitest default 5s on cold machines / CI. Bump per-test.
  it('re-exports the FailLens + doctor + kb symbols consumers rely on', {timeout: 30_000}, async () => {
    const mod = await import('../src/lib.js');
    const expected = [
      'resolve',
      'resolveByName',
      'collectReport',
      'diagnose',
      'loadKb',
      'loadIndex',
      'lookup',
      'indexLookup',
      'indexSize',
      'kbSize',
      'kbPath',
      'indexMatchesChain',
      'INDEX_SPEC_NAME',
      'INDEX_SPEC_VERSION',
      'getApi',
      'closeApi',
      'DEFAULT_NODE',
      'VERSION',
      'resolveNode',
      'validateNodeUrl',
    ];
    for (const name of expected) {
      expect(mod, `library must export "${name}"`).toHaveProperty(name);
    }
  });
});
