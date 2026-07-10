/**
 * `pdk-ts doctor`'s liveness display — pure-function coverage for the
 * part that doesn't need a live node. The actual block-advancing check
 * (`collectReport`) was verified end-to-end against wss://rpc.polkadot.io
 * during development: producing=true showed real advancing block
 * numbers, and --no-liveness correctly skipped the ~7s wait.
 *
 * This ports Python `pdk doctor --liveness`'s stall-detection to the TS
 * side — previously pdk-ts's doctor had no liveness concept at all,
 * meaning "reachable" and "healthy" were conflated even though a
 * stalled dev chain (the exact BABE epoch-change scenario Python's
 * doctor documents a fix for) would report clean.
 */

import {describe, it, expect} from 'vitest';
import {renderText, type DoctorReport} from '../src/commands/doctor.js';

function baseReport(overrides: Partial<DoctorReport> = {}): DoctorReport {
  return {
    endpoint: 'wss://rpc.polkadot.io',
    chain: 'Polkadot',
    nodeName: 'Parity Polkadot',
    nodeVersion: '1.24.0',
    specName: 'polkadot',
    specVersion: 2003000,
    palletCount: 61,
    contractsPresent: false,
    ...overrides,
  };
}

describe('doctor renderText liveness', () => {
  it('omits the liveness line entirely when liveness was not checked', () => {
    const out = renderText(baseReport({liveness: undefined}));
    expect(out).not.toMatch(/producing blocks|stalled/);
  });

  it('shows a green "producing blocks" line with before/after block numbers', () => {
    const out = renderText(
      baseReport({liveness: {checked: true, producing: true, blockBefore: 100, blockAfter: 102}}),
    );
    expect(out).toMatch(/producing blocks/);
    expect(out).toContain('#100');
    expect(out).toContain('#102');
  });

  it('shows a red "stalled" line when the block number did not advance', () => {
    const out = renderText(
      baseReport({liveness: {checked: true, producing: false, blockBefore: 500, blockAfter: 500}}),
    );
    expect(out).toMatch(/stalled/);
    expect(out).toContain('#500');
  });
});
