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
import {installConsoleFilter} from './core/chain.js';

// CLI-only side effect: silence @polkadot/api's verbose stdout so that
// `--json` output stays pure JSON. Library consumers of `portaldot-pdk-ts`
// never load this file — their console stays untouched.
installConsoleFilter();
import * as doctor from './commands/doctor.js';
import * as accounts from './commands/accounts.js';
import * as version from './commands/version.js';
import * as pallets from './commands/pallets.js';
import * as storage from './commands/storage.js';
import * as keys from './commands/keys.js';
import * as explain from './commands/explain.js';
import * as diagnose from './commands/diagnose.js';
import * as examples from './commands/examples.js';
import * as kb from './commands/kb.js';

const program = new Command();

// Commander's default on an unknown command is a bare "error: unknown
// command 'X'". Add a hint pointing at the built-in help.
program.showSuggestionAfterError(true);
program.showHelpAfterError('(run `pdk-ts --help` for the full command list)');

program
  .name('pdk-ts')
  .description('TypeScript companion CLI for pdk (Portaldot Dev Kit)')
  .version(VERSION, '-v, --version', 'print version + build status (same as `pdk-ts version`)')
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
  .option('--liveness', 'check the chain is producing blocks, ~7s (default: on)', true)
  .option('--no-liveness', 'skip the block-production check')
  .option('--json', 'emit machine-readable JSON')
  .action((opts) => doctor.run(opts));

program
  .command('accounts')
  .description('List pre-funded dev accounts and their POT balance')
  .option('--node <url>', 'WebSocket endpoint (overrides PDK_TS_NODE)')
  .option('--all', 'include //Dave, //Eve, //Ferdie (default: Alice/Bob/Charlie)')
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
  .description('Read a value from runtime storage (raw, in the storage item\'s native unit — Balance-type values are plancks, not POT/DOT)')
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
  .command('kb')
  .description('Knowledge-base introspection — coverage, missing entries, or full list')
  .option('--missing', 'list index entries without a curated KB fix')
  .option('--list', 'list every curated KB entry')
  .option('--json', 'emit machine-readable JSON')
  .action((opts) => kb.run(opts));

program
  .command('version')
  .description('Print pdk-ts version and status')
  .option('--json', 'emit machine-readable JSON')
  .action((opts) => version.run(opts));

// Default help when no command given. Include a first-run tip so
// users immediately know where to find worked example invocations.
if (process.argv.length <= 2) {
  program.outputHelp();
  console.log('\nTip: run `pdk-ts examples` for a curated list of ready-to-copy invocations.\n');
  process.exit(0);
}

/**
 * Guard against async errors that leak past command handlers.
 * `@polkadot/api` can raise on the WebSocket AFTER a command has
 * returned — without these handlers the user sees a bare Node stack
 * trace and the process exits without closing the socket.
 */
import {readableError} from './core/errors.js';

process.on('unhandledRejection', (reason) => {
  process.stderr.write(`pdk-ts: unhandled rejection: ${readableError(reason)}\n`);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  process.stderr.write(`pdk-ts: uncaught exception: ${readableError(err)}\n`);
  process.exit(1);
});

program.parseAsync(process.argv).catch((err) => {
  console.error(readableError(err));
  process.exit(1);
});
