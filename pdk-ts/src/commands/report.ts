/**
 * `pdk-ts report` — scan recent blocks and group every decoded failure.
 *
 * Read-only failure analytics: "what's been failing on this chain, and
 * why?" Walks back `--blocks` from the chain head, finds every
 * `system.ExtrinsicFailed` event, decodes its DispatchError into a
 * `Pallet.Error` label (via the runtime metadata), and counts them.
 *
 * Ports the shape of Python `pdk report --json` exactly
 * (`{blocks_scanned, total_failures, by_error: [{error, count}]}`) so a
 * script consumes either CLI interchangeably.
 */

import pc from 'picocolors';
import {getApi, closeApi} from '../core/chain.js';
import {resolveNode} from '../core/config.js';
import {humanizeChainError, stripControlChars} from '../core/errors.js';

export interface ReportOptions {
  node?: string;
  blocks?: string;
  timeout?: string;
  json?: boolean;
}

export interface ReportResult {
  blocks_scanned: number;
  total_failures: number;
  by_error: Array<{error: string; count: number}>;
  // Present (>0) only when @polkadot/api couldn't decode some blocks'
  // events on this chain — see collectFailures. Core fields
  // (blocks_scanned/total_failures/by_error) match Python's shape exactly.
  blocks_undecodable?: number;
}

const DEFAULT_BLOCKS = 20;

/**
 * Walk back `blocks` from the chain head, decoding every
 * `system.ExtrinsicFailed`. Stops cleanly at genesis (empty parent hash).
 *
 * Portaldot's runtime metadata contains type shapes @polkadot/api can't
 * always decode (the same "Unable to map [u8; 32]" limitation that makes
 * Python's substrate-interface — with its node-template preset — the more
 * reliable decoder here). Rather than abort the whole scan on one
 * undecodable block, we skip it and count it in `blocks_undecodable`, so
 * the count is honest about being partial instead of silently low. For
 * complete failure analytics on Portaldot, prefer Python `pdk report`.
 */
export async function collectFailures(
  node: string,
  blocks: number,
  timeoutMs?: number,
): Promise<ReportResult> {
  const api = await getApi(node, timeoutMs);
  const counts = new Map<string, number>();
  let totalFailures = 0;
  let scanned = 0;
  let undecodable = 0;

  let hash = (await api.rpc.chain.getHeader()).hash;
  for (let i = 0; i < blocks; i++) {
    try {
      const apiAt = await api.at(hash);
      const events = (await apiAt.query.system.events()) as unknown as Array<{event: unknown}>;
      for (const {event} of events) {
        if (api.events.system.ExtrinsicFailed.is(event as never)) {
          const [dispatchError] = (event as {data: unknown[]}).data;
          const label = labelFor(api, dispatchError);
          counts.set(label, (counts.get(label) ?? 0) + 1);
          totalFailures++;
        }
      }
    } catch {
      // @polkadot/api couldn't decode this block's events on Portaldot.
      undecodable++;
    }
    scanned++;

    const header = await api.rpc.chain.getHeader(hash);
    const parent = header.parentHash;
    if (parent.isEmpty || parent.eq(hash)) break;
    hash = parent;
  }

  return buildReport(counts, scanned, totalFailures, undecodable);
}

/**
 * Assemble the report from raw counts — pure, no node. by_error is
 * most-frequent-first, ties broken alphabetically (identical ordering to
 * Python's `summarize`). blocks_undecodable is omitted when zero so the
 * core shape matches Python exactly.
 */
export function buildReport(
  counts: Map<string, number>,
  scanned: number,
  totalFailures: number,
  undecodable: number,
): ReportResult {
  const by_error = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([error, count]) => ({error, count}));
  const result: ReportResult = {blocks_scanned: scanned, total_failures: totalFailures, by_error};
  if (undecodable > 0) result.blocks_undecodable = undecodable;
  return result;
}

/** Decode a DispatchError into a `Pallet.Error` label matching Python's casing. */
// biome-ignore lint/suspicious/noExplicitAny: @polkadot codec types are structural; a narrow shim conflicts with findMetaError's real signature.
function labelFor(api: any, dispatchError: any): string {
  if (dispatchError?.isModule) {
    try {
      const meta = api.registry.findMetaError(dispatchError.asModule);
      const section: string = meta.section ?? '';
      // Python renders "Balances.InsufficientBalance" (capitalized pallet).
      const capped = section ? section[0].toUpperCase() + section.slice(1) : section;
      return stripControlChars(`${capped}.${meta.name}`);
    } catch {
      return 'Unknown';
    }
  }
  // Non-module DispatchError variants (BadOrigin, CannotLookup, …).
  return stripControlChars(dispatchError?.type ?? 'Unknown');
}

export async function run(opts: ReportOptions): Promise<void> {
  const node = resolveNode(opts.node);
  const blocks = opts.blocks ? Number(opts.blocks) : DEFAULT_BLOCKS;
  const timeoutMs = opts.timeout ? Math.round(Number(opts.timeout) * 1000) : undefined;

  if (!Number.isInteger(blocks) || blocks < 1) {
    const msg = '--blocks must be a positive integer.';
    if (opts.json) console.log(JSON.stringify({error: msg}));
    else console.error(pc.red(`\n  ✗ ${msg}\n`));
    process.exit(1);
  }

  try {
    const result = await collectFailures(node, blocks, timeoutMs);
    if (opts.json) {
      console.log(JSON.stringify(result));
      await closeApi();
      return;
    }
    console.log();
    console.log(pc.bold('  pdk-ts report') + pc.dim(`  (last ${result.blocks_scanned} blocks)`));
    console.log();
    if (result.total_failures === 0) {
      console.log(pc.green('  ✓ no failed extrinsics in range.'));
      console.log(pc.dim('  A clean chain — or trigger one with the Python `pdk debug --demo`.'));
      console.log();
      await closeApi();
      return;
    }
    const width = Math.max(6, ...result.by_error.map((e) => e.error.length));
    console.log(`  ${pc.dim('error'.padEnd(width))}  ${pc.dim('count')}`);
    for (const {error, count} of result.by_error) {
      console.log(`  ${pc.red(error.padEnd(width))}  ${pc.bold(String(count))}`);
    }
    console.log();
    console.log(pc.dim(`  ${result.total_failures} failed extrinsic(s) across ${result.by_error.length} error type(s).`));
    if (result.blocks_undecodable) {
      console.log(pc.yellow(`  ⚠ ${result.blocks_undecodable} block(s) skipped — @polkadot/api couldn't decode their events on Portaldot.`));
      console.log(pc.dim('    Counts are partial; Python `pdk report` decodes Portaldot events reliably.'));
    }
    console.log();
  } catch (err) {
    const msg = humanizeChainError(err, node);
    if (opts.json) console.log(JSON.stringify({error: msg, endpoint: node}));
    else console.error(pc.red(`\n  ✗ report failed — ${msg}\n`));
    await closeApi();
    process.exit(1);
  }
  await closeApi();
}
