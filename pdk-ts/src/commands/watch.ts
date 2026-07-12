/**
 * `pdk-ts watch` — live-stream chain events as blocks are produced.
 *
 * Where `report` looks backward and groups failures, `watch` looks
 * forward: a general-purpose monitor of what the chain is doing right now.
 * Subscribes to new heads, decodes each block's events, and prints them
 * (optionally filtered to one pallet). Ctrl+C to stop.
 *
 * Same honesty as `report`: Portaldot ships type shapes @polkadot/api
 * can't always decode ("Unable to map [u8; 32]"), so a block whose events
 * don't decode is skipped with a one-line note instead of aborting the
 * stream. For guaranteed-complete event decoding, use Python `pdk watch`.
 */

import pc from 'picocolors';
import {getApi, closeApi} from '../core/chain.js';
import {resolveNode} from '../core/config.js';
import {humanizeChainError, stripControlChars} from '../core/errors.js';

export interface WatchOptions {
  pallet?: string;
  node?: string;
  timeout?: string;
  json?: boolean;
}

/** Should this event be shown, given an optional pallet filter? */
export function passesFilter(section: string, pallet?: string): boolean {
  return !pallet || section.toLowerCase() === pallet.toLowerCase();
}

export async function run(opts: WatchOptions): Promise<void> {
  const node = resolveNode(opts.node);
  const timeoutMs = opts.timeout ? Math.round(Number(opts.timeout) * 1000) : undefined;
  const pallet = opts.pallet;

  let unsub: (() => void) | undefined;
  const stop = async (code: number) => {
    if (unsub) unsub();
    await closeApi();
    process.exit(code);
  };

  try {
    const api = await getApi(node, timeoutMs);
    if (!opts.json) {
      const scope = pallet ? pc.dim(` · pallet=${pallet}`) : '';
      console.log(pc.dim(`\n  Watching events${scope} — Ctrl+C to stop.\n`));
    }

    // Ctrl+C: unsubscribe + close the socket cleanly, then exit 0
    // (stopping a monitor on purpose is success, not failure). getApi()
    // already installed its own SIGINT handler that exits 130; leaving both
    // registered races them (nondeterministic 0-or-130 exit + a double
    // provider.disconnect). Own the signal here so watch's intent wins.
    process.removeAllListeners('SIGINT');
    process.on('SIGINT', () => {
      if (!opts.json) console.log(pc.dim('\n  stopped.'));
      void stop(0);
    });

    unsub = await api.rpc.chain.subscribeNewHeads(async (header) => {
      const number = header.number.toNumber();
      const hash = header.hash;
      try {
        const apiAt = await api.at(hash);
        const events = (await apiAt.query.system.events()) as unknown as Array<{
          event: {section: string; method: string; data: {toString(): string}};
        }>;
        for (const {event} of events) {
          if (!passesFilter(event.section, pallet)) continue;
          const section = stripControlChars(event.section);
          const method = stripControlChars(event.method);
          const data = stripControlChars(event.data.toString());
          if (opts.json) {
            console.log(JSON.stringify({block: number, section, method, data}));
          } else {
            console.log(`  ${pc.dim(`#${number}`)} ${pc.cyan(`${section}.${method}`)} ${pc.dim(data)}`);
          }
        }
      } catch {
        // @polkadot/api couldn't decode this block's events on Portaldot.
        if (opts.json) console.log(JSON.stringify({block: number, undecodable: true}));
        else console.log(`  ${pc.dim(`#${number}`)} ${pc.yellow('⚠ events undecodable — skipped (use Python `pdk watch`)')}`);
      }
    });

    // Keep the process alive; SIGINT resolves it. (subscribeNewHeads holds
    // the socket open, but nothing else awaits, so park here explicitly.)
    await new Promise<never>(() => {});
  } catch (err) {
    const msg = humanizeChainError(err, node);
    if (opts.json) console.log(JSON.stringify({error: msg, endpoint: node}));
    else console.error(pc.red(`\n  ✗ watch failed — ${msg}\n`));
    await stop(1);
  }
}
