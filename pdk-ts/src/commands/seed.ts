/**
 * `pdk-ts seed` — fund accounts from a YAML fixtures file so you start
 * testing from realistic multi-account state instead of just //Alice.
 *
 * Signing tier, same as `send`: each `fund` fixture is a REAL
 * transferKeepAlive from //Alice. Outcome detection is shared with `send`
 * (submitTransfer) — success is confirmed only by a positive
 * ExtrinsicSuccess event, never by the absence of a dispatchError, so a
 * failed fund is never counted as applied.
 */

import {existsSync, readFileSync} from 'node:fs';
import {resolve, dirname, basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import pc from 'picocolors';
import {Keyring} from '@polkadot/api';
import {parse as parseYaml} from 'yaml';
import {getApi, closeApi} from '../core/chain.js';
import {resolveNode} from '../core/config.js';
import {humanizeChainError} from '../core/errors.js';
import {normaliseUri} from './keys.js';
import {potToPlancks, resolveRecipient, submitTransfer, type TransferOutcome} from './send.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(fileURLToPath(import.meta.url));

/** Same lookup order as kb.ts uses for the shared knowledge base. */
const DEFAULT_FIXTURE_CANDIDATES = [
  resolve(__dirname, '../../..', 'pdk/data/seed.example.yaml'),
  resolve(__dirname, '..', 'pdk-data/seed.example.yaml'),
];

interface Fixture {
  type?: string;
  to?: string;
  pot?: number | string;
}

export interface SeedOptions {
  file?: string;
  node?: string;
  timeout?: string;
  json?: boolean;
}

function resolveFixtureFile(file?: string): string | null {
  if (file) {
    if (!existsSync(file)) throw new Error(`fixtures file "${file}" does not exist`);
    return file;
  }
  for (const path of DEFAULT_FIXTURE_CANDIDATES) {
    if (existsSync(path)) return path;
  }
  return null;
}

export async function run(opts: SeedOptions): Promise<void> {
  const node = resolveNode(opts.node);
  const timeoutMs = opts.timeout ? Math.round(Number(opts.timeout) * 1000) : undefined;

  let path: string | null;
  let fixtures: Fixture[];
  try {
    path = resolveFixtureFile(opts.file);
    if (!path) throw new Error('no bundled seed.example.yaml found (run from a repo clone, or pass --file)');
    const parsed = parseYaml(readFileSync(path, 'utf-8')) as {fixtures?: Fixture[]} | null;
    fixtures = parsed?.fixtures ?? [];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (opts.json) console.log(JSON.stringify({error: `Cannot read fixtures: ${msg}`}));
    else console.error(pc.red(`\n  ✗ cannot read fixtures — ${msg}\n`));
    process.exit(1);
    return;
  }

  try {
    const api = await getApi(node, timeoutMs);
    const keyring = new Keyring({type: 'sr25519', ss58Format: 42});
    const alice = keyring.addFromUri(normaliseUri('//Alice'));

    const results: Array<{to: string; pot: number; status: TransferOutcome['status']; tx: string | null}> = [];
    let applied = 0;

    if (!opts.json) console.log(pc.bold(`\n  Seeding from ${basename(path)} — ${fixtures.length} fixtures`));

    for (const fx of fixtures) {
      if (fx.type !== 'fund') {
        if (!opts.json) console.log(pc.yellow(`  • skipped unsupported fixture type: ${fx.type}`));
        continue;
      }
      const to = String(fx.to ?? '');
      const pot = Number(fx.pot ?? 0);
      if (!to || !Number.isFinite(pot) || pot <= 0) {
        if (!opts.json) console.log(pc.yellow(`  • skipped malformed fund fixture: ${JSON.stringify(fx)}`));
        continue;
      }
      try {
        const dest = resolveRecipient(keyring, to);
        const outcome = await submitTransfer(api, alice, dest, potToPlancks(String(pot)));
        if (outcome.status === 'success') applied += 1;
        results.push({to, pot, status: outcome.status, tx: outcome.txHash});
        if (!opts.json) {
          const mark =
            outcome.status === 'success' ? pc.green('✓')
            : outcome.status === 'unconfirmed' ? pc.yellow('⚠')
            : pc.red('✗');
          const note =
            outcome.status === 'success' ? ''
            : outcome.status === 'unconfirmed' ? pc.dim(`  (unconfirmed — verify: pdk debug ${outcome.txHash})`)
            : pc.dim(`  (failed${outcome.error ? ` — ${outcome.error}` : ''})`);
          console.log(`  ${mark} funded ${to} with ${pot.toLocaleString('en-US')} POT${note}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({to, pot, status: 'failed', tx: null});
        if (!opts.json) console.log(pc.red(`  ✗ fund ${to} failed: ${msg.slice(0, 90)}`));
      }
    }

    if (opts.json) {
      console.log(JSON.stringify({file: basename(path), total: fixtures.length, applied, results}));
    } else {
      const tone = applied === fixtures.length ? pc.green : pc.yellow;
      console.log(tone(`\n  seed complete — ${applied}/${fixtures.length} accounts funded.\n`));
    }
    await closeApi();
    if (applied < fixtures.length) process.exit(1);
  } catch (err) {
    const msg = humanizeChainError(err, node);
    if (opts.json) console.log(JSON.stringify({error: msg, endpoint: node}));
    else console.error(pc.red(`\n  ✗ seed failed — ${msg}\n`));
    await closeApi();
    process.exit(1);
  }
}
