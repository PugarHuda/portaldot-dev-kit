/**
 * `PDK_KB_PATH` / `PDK_INDEX_PATH` fail-hard behavior — locks the
 * round-10 fix that swapped silent fallback for an explicit throw.
 *
 * We spawn a fresh Node subprocess per case so cached modules don't
 * carry state between scenarios.
 */

import {describe, it, expect} from 'vitest';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';

const DIST = resolve(__dirname, '..', 'dist', 'index.js');
const BOGUS = '/tmp/pdk-does-not-exist-12345.yaml';

function run(env: Record<string, string>): {stdout: string; stderr: string; code: number} {
  try {
    const stdout = execFileSync('node', [DIST, 'diagnose', '--skip-connect', '--json'], {
      env: {...process.env, ...env},
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return {stdout, stderr: '', code: 0};
  } catch (e) {
    const err = e as {stdout?: string; stderr?: string; status?: number};
    return {stdout: err.stdout ?? '', stderr: err.stderr ?? '', code: err.status ?? 1};
  }
}

describe('PDK_KB_PATH env fail-hard', () => {
  it('throws when the path is set but does not exist', () => {
    const r = run({PDK_KB_PATH: BOGUS});
    // Message routes through the CLI error path — either stderr or a
    // JSON error field. Just require the offending path to appear
    // somewhere so the user can act.
    const combined = r.stdout + r.stderr;
    expect(combined).toContain(BOGUS);
    expect(combined.toLowerCase()).toMatch(/does not exist|silently fall back/);
  });

  it('throws when PDK_INDEX_PATH is set but does not exist', () => {
    const r = run({PDK_INDEX_PATH: BOGUS});
    const combined = r.stdout + r.stderr;
    expect(combined).toContain(BOGUS);
    expect(combined.toLowerCase()).toMatch(/does not exist|silently fall back/);
  });

  it('runs cleanly when env is unset (falls back to shipped defaults)', () => {
    const r = run({});
    expect(r.code).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.kb.entries).toBeGreaterThan(0);
    expect(parsed.index.entries).toBeGreaterThan(100);
  });
});
