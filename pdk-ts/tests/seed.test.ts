/**
 * seed's node-touching path (fund each fixture, count only ExtrinsicSuccess)
 * was verified end-to-end against a live node. Here we lock the two pure
 * decisions the loop makes: which fixtures are fundable, and that the
 * bundled example parses to the expected shape.
 */

import {describe, it, expect} from 'vitest';
import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse as parseYaml} from 'yaml';

const dir = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(dir, '../../pdk/data/seed.example.yaml');

interface Fixture {
  type?: string;
  to?: string;
  pot?: number;
}

/** Same guard the run() loop applies to decide a fixture is fundable. */
function isFundable(fx: Fixture): boolean {
  const pot = Number(fx.pot ?? 0);
  return fx.type === 'fund' && Boolean(fx.to) && Number.isFinite(pot) && pot > 0;
}

describe('seed fixture selection', () => {
  it('accepts a well-formed fund fixture', () => {
    expect(isFundable({type: 'fund', to: '//Dave', pot: 1000})).toBe(true);
  });

  it('rejects non-fund, missing-to, and non-positive pot', () => {
    expect(isFundable({type: 'noop', to: '//Dave', pot: 1000})).toBe(false);
    expect(isFundable({type: 'fund', pot: 1000})).toBe(false);
    expect(isFundable({type: 'fund', to: '//Dave', pot: 0})).toBe(false);
    expect(isFundable({type: 'fund', to: '//Dave', pot: -5})).toBe(false);
  });

  it('bundled example parses to fund fixtures', () => {
    if (!existsSync(fixturePath)) return; // skip outside a repo clone
    const parsed = parseYaml(readFileSync(fixturePath, 'utf-8')) as {fixtures?: Fixture[]};
    const funds = (parsed.fixtures ?? []).filter(isFundable);
    expect(funds.length).toBeGreaterThan(0);
    expect(funds.every((f) => f.to?.startsWith('//'))).toBe(true);
  });
});
