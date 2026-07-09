/**
 * Offline-only demo: FailLens by name, no node required.
 *
 * Useful when showing pdk-ts to someone without network access, or
 * when the default `npm start` would fail because flow 2 hits a live
 * Substrate RPC.
 */

import {resolveByName} from 'portaldot-pdk-ts';

const cases = [
  'balances.InsufficientBalance',
  'balances.ExistentialDeposit',
  'assets.NoPermission',
];

for (const name of cases) {
  const r = resolveByName(name);
  console.log(`\n--- ${name} ---`);
  if (!r) {
    console.log('  (no KB entry)');
    continue;
  }
  console.log(`  ${r.palletName}.${r.errorName}`);
  console.log(`  ${r.summary}`);
  for (const step of r.steps) console.log(`  → ${step}`);
}

process.exit(0);
