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

const program = new Command();

program
  .name('pdk-ts')
  .description('TypeScript companion CLI for pdk (Portaldot Dev Kit)')
  .version(VERSION);

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
  .command('version')
  .description('Print pdk-ts version and status')
  .action(() => version.run());

// Default help when no command given
if (process.argv.length <= 2) {
  program.outputHelp();
  process.exit(0);
}

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
