/**
 * `pdk-ts version` — print the CLI version and a short status line so
 * users can quickly confirm which alpha they are running.
 */

import pc from 'picocolors';
import {VERSION} from '../core/config.js';

export function run(): void {
  console.log();
  console.log(`  ${pc.bold('pdk-ts')} ${pc.green(VERSION)}`);
  console.log(pc.dim('  TypeScript companion for pdk — v0.2 alpha (alpha.2 · read-only surface)'));
  console.log();
}
