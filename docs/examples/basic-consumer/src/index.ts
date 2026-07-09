/**
 * Minimal consumer example: shows two flows a dApp author might use.
 *
 * Flow 1 — programmatic FailLens decode. Parse a raw code inside your
 *          app, surface the human-friendly error to the user.
 * Flow 2 — doctor health probe. Call from a backend health endpoint.
 *
 * This file intentionally imports from the pdk-ts internals so you can
 * see the shape of the exported API. When pdk-ts ships to npm at 0.2.0,
 * imports resolve to the published package.
 */

// Types are inferred from the pdk-ts declarations.
import {resolveByName, resolve as resolveByIndex} from 'portaldot-pdk-ts/dist/commands/explain.js';
import {collectReport} from 'portaldot-pdk-ts/dist/commands/doctor.js';

async function flowExplain(): Promise<void> {
  console.log('\n--- flow 1: programmatic explain ---');

  // Case A — you already know the name (offline)
  const byName = resolveByName('balances.InsufficientBalance');
  if (byName) {
    console.log(`${byName.palletName}.${byName.errorName}`);
    console.log(`  ${byName.summary}`);
    for (const step of byName.steps) console.log(`  → ${step}`);
  }

  // Case B — you have the raw code + a live node
  //   const byIndex = await resolveByIndex('ws://127.0.0.1:9944', 6, 2);
  //   console.log(byIndex);
}

async function flowDoctor(): Promise<void> {
  console.log('\n--- flow 2: doctor health probe ---');
  const report = await collectReport('wss://rpc.polkadot.io');
  console.log(`Endpoint: ${report.endpoint}`);
  console.log(`Chain:    ${report.chain}`);
  console.log(`Runtime:  ${report.specName} ${report.specVersion}`);
  console.log(`Pallets:  ${report.palletCount}`);
}

(async () => {
  await flowExplain();
  await flowDoctor();
  process.exit(0);
})();
