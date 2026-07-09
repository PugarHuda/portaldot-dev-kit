#!/usr/bin/env node
/**
 * pdk-ts — TypeScript companion CLI for the Portaldot Dev Kit.
 *
 * Wires each `commands/<name>.ts` module into a commander program so
 * `pdk-ts <name>` runs the corresponding handler. Chain-touching commands
 * take a `--node <ws-url>` flag; JSON output via `--json` for scripting.
 *
 * v0.2.0-alpha.1 scope: doctor, accounts, version.
 * Next alphas (in order):
 *   .2  pallets · storage · keys
 *   .3  simulate · send · seed
 *   .4  debug · explain · report · watch · ai-setup
 *   .5  PAPI migration spike + benchmark vs @polkadot/api
 */

import {Command} from 'commander';
import {VERSION} from './core/config.js';
import * as doctor from './commands/doctor.js';
import * as accounts from './commands/accounts.js';
import * as version from './commands/version.js';
import * as pallets from './commands/pallets.js';
import * as storage from './commands/storage.js';
import * as keys from './commands/keys.js';
import * as explain from './commands/explain.js';
import * as diagnose from './commands/diagnose.js';
import * as examples from './commands/examples.js';

const program = new Command();

program
  .name('pdk-ts')
  .description('TypeScript companion CLI for pdk (Portaldot Dev Kit)')
  .version(VERSION)
  .addHelpText(
    'after',
    `
Examples:
  $ pdk-ts doctor --node ws://127.0.0.1:9944
  $ pdk-ts accounts --json
  $ pdk-ts pallets Balances
  $ pdk-ts storage System Number
  $ pdk-ts keys //Alice
  $ pdk-ts explain --module 6 --error 2       (offline fast path)
  $ pdk-ts explain --name balances.InsufficientBalance
  $ pdk-ts explain --module 6 --error 2 --live  (force metadata walk)

Environment:
  PDK_TS_NODE            override the default ws://127.0.0.1:9944
  PDK_KB_PATH            custom path to error_fixes.yaml (shared with pdk)
  PDK_INDEX_PATH         custom path to error_index.json
  DEBUG_POLKADOT_API=1   restore @polkadot/api verbose logs
`,
  );

program
  .command('doctor')
  .description('Health probe against a Portaldot node')
  .option('--node <url>', 'WebSocket endpoint (overrides PDK_TS_NODE)')
  .option('--timeout <seconds>', 'connect timeout in seconds (default 15)')
  .option('--json', 'emit machine-readable JSON')
  .action((opts) => doctor.run(opts));

program
  .command('accounts')
  .description('List pre-funded dev accounts and their POT balance')
  .option('--node <url>', 'WebSocket endpoint (overrides PDK_TS_NODE)')
  .option('--json', 'emit machine-readable JSON')
  .action((opts) => accounts.run(opts));

program
  .command('pallets [name]')
  .description('Browse runtime pallets — list all, or detail one')
  .option('--node <url>', 'WebSocket endpoint (overrides PDK_TS_NODE)')
  .option('--timeout <seconds>', 'connect timeout in seconds (default 15)')
  .option('--json', 'emit machine-readable JSON')
  .action((name, opts) => pallets.run(name, opts));

program
  .command('storage <pallet> <item> [keys...]')
  .description('Read a value from runtime storage')
  .option('--node <url>', 'WebSocket endpoint (overrides PDK_TS_NODE)')
  .option('--timeout <seconds>', 'connect timeout in seconds (default 15)')
  .option('--json', 'emit machine-readable JSON')
  .action((pallet, item, k, opts) => storage.run(pallet, item, k ?? [], opts));

program
  .command('keys [source]')
  .description('Inspect or generate a keypair (SS58 format 42)')
  .option('--words <n>', 'mnemonic word count when generating (12/15/18/21/24)', '12')
  .option('--json', 'emit machine-readable JSON')
  .action((source, opts) => keys.run(source, opts));

program
  .command('explain')
  .description('Decode a raw Module/error code into a named error + fix steps')
  .option('--module <n>', 'pallet index (from the DispatchError code)')
  .option('--error <n>', 'error index within the pallet')
  .option('--name <pallet.error>', 'skip metadata walk, look up by name directly')
  .option('--live', 'skip the offline index, always walk live runtime metadata')
  .option('--node <url>', 'WebSocket endpoint (overrides PDK_TS_NODE)')
  .option('--timeout <seconds>', 'connect timeout in seconds (default 15)')
  .option('--json', 'emit machine-readable JSON')
  .action((opts) => explain.run(opts));

program
  .command('diagnose')
  .description('Report tool version + KB + index + connectivity status')
  .option('--node <url>', 'WebSocket endpoint (overrides PDK_TS_NODE)')
  .option('--timeout <seconds>', 'connect timeout in seconds (default 8)')
  .option('--skip-connect', 'skip the network probe, report tool + KB only')
  .option('--json', 'emit machine-readable JSON')
  .action((opts) => diagnose.run(opts));

program
  .command('examples')
  .description('Print a curated list of example invocations, grouped by task')
  .action(() => examples.run());

program
  .command('version')
  .description('Print pdk-ts version and status')
  .option('--json', 'emit machine-readable JSON')
  .action((opts) => version.run(opts));

// Default help when no command given
if (process.argv.length <= 2) {
  program.outputHelp();
  process.exit(0);
}

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
