/**
 * `pdk-ts version` — print the CLI version and a short status line so
 * users can quickly confirm which alpha they are running.
 */

import pc from 'picocolors';
import {VERSION} from '../core/config.js';

export interface VersionOptions {
  json?: boolean;
}

export function run(opts: VersionOptions = {}): void {
  const status = 'alpha.4 · library-importable + hardened';
  if (opts.json) {
    console.log(JSON.stringify({name: 'pdk-ts', version: VERSION, status}, null, 2));
    return;
  }
  console.log();
  console.log(`  ${pc.bold('pdk-ts')} ${pc.green(VERSION)}`);
  console.log(pc.dim(`  TypeScript companion for pdk — v0.2 alpha (${status})`));
  console.log();
}
