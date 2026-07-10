/**
 * `pdk-ts storage <pallet> <item> [keys...]` — read any storage value
 * from the runtime. Ports Python `pdk storage` behavior.
 *
 * The pallet/item names must exist in the runtime metadata. If they do
 * not, we surface a suggestion pointing at `pdk-ts pallets` for
 * discovery.
 *
 * For map/double-map/n-map storage items, positional keys are passed
 * through to `api.query.<pallet>.<item>(key1, key2, ...)` in order.
 *
 * Values print via `.toHuman()` when available, which does NOT apply
 * chain-decimal scaling for Balance-type values (confirmed against a
 * live node: `Balances.TotalIssuance` prints the raw planck count,
 * comma-grouped, not divided by 10^decimals). This command is a
 * generic storage browser — most items have no monetary meaning at
 * all (System.Number, arbitrary pallet storage) — so it intentionally
 * does NOT guess which values are Balance-shaped and auto-scale them;
 * that heuristic would be unreliable and is `accounts.ts`'s job, not
 * this one. If you need a human POT amount, divide by 10^14 yourself
 * or use `pdk-ts accounts`.
 */

import pc from 'picocolors';
import {getApi, closeApi} from '../core/chain.js';
import {resolveNode} from '../core/config.js';
import {humanizeChainError, stripControlChars} from '../core/errors.js';

export interface StorageOptions {
  node?: string;
  json?: boolean;
  timeout?: string;
}

export async function run(
  pallet: string,
  item: string,
  keys: string[],
  opts: StorageOptions,
): Promise<void> {
  const node = resolveNode(opts.node);
  const timeoutMs = opts.timeout ? Math.round(Number(opts.timeout) * 1000) : undefined;

  try {
    const api = await getApi(node, timeoutMs);
    // Substrate storage lookups are Pallet.method — but @polkadot/api
    // canonicalises the pallet name to camelCase on the query proxy.
    // We accept either case-form from the user and normalise here.
    const palletKey = findKey(api.query as unknown as Record<string, unknown>, pallet);
    if (!palletKey) {
      const msg = `pallet "${pallet}" not found in api.query — try \`pdk-ts pallets\` to list`;
      if (opts.json) console.log(JSON.stringify({error: msg}, null, 2));
      else console.error(pc.red(`\n  ✗ ${msg}\n`));
      await closeApi();
      process.exit(1);
    }
    const palletObj = (api.query as unknown as Record<string, Record<string, unknown>>)[palletKey];
    const itemKey = findKey(palletObj, item);
    if (!itemKey) {
      const msg = `storage item "${item}" not found in pallet "${palletKey}"`;
      if (opts.json) console.log(JSON.stringify({error: msg}, null, 2));
      else console.error(pc.red(`\n  ✗ ${msg}\n`));
      await closeApi();
      process.exit(1);
    }
    const fn = palletObj[itemKey] as (...args: unknown[]) => Promise<unknown>;
    // For map/double-map storage items, forward keys as-is — @polkadot/api
    // knows to auto-encode SS58 addresses to AccountId, Hash strings to
    // H256, etc, via its type registry. For tuple keys, use a JSON-array
    // string: `pdk-ts storage <p> <i> '["0x...", 42]'`.
    const decodedKeys = keys.map((k) => {
      if (k.startsWith('[') || k.startsWith('{')) {
        try {
          return JSON.parse(k);
        } catch {
          return k;
        }
      }
      return k;
    });
    const result = await fn(...decodedKeys);
    const readable = normalise(result);

    if (opts.json) {
      console.log(
        JSON.stringify({pallet: palletKey, item: itemKey, keys, value: readable}, null, 2),
      );
    } else {
      const title = `${palletKey}.${itemKey}${keys.length ? ` (${keys.join(', ')})` : ''}`;
      console.log();
      console.log(pc.bold(`  ${title}`));
      console.log();
      console.log(`  ${formatValue(readable)}`);
      console.log();
    }
  } catch (err) {
    const msg = humanizeChainError(err, node);
    if (opts.json) console.log(JSON.stringify({error: msg, endpoint: node}, null, 2));
    else console.error(pc.red(`\n  ✗ storage failed — ${msg}\n`));
    await closeApi();
    process.exit(1);
  }
  await closeApi();
}

function findKey(obj: Record<string, unknown>, name: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const target = name.toLowerCase();
  return Object.keys(obj).find((k) => k.toLowerCase() === target);
}

// Convert Polkadot Codec result to a plain JS value for JSON output.
// Falls back to toString when no plain form exists.
function normalise(v: unknown): unknown {
  if (v == null) return v;
  if (typeof v === 'object') {
    const anyV = v as {
      toHuman?: () => unknown;
      toJSON?: () => unknown;
      toString?: () => string;
    };
    if (typeof anyV.toHuman === 'function') return anyV.toHuman();
    if (typeof anyV.toJSON === 'function') return anyV.toJSON();
    if (typeof anyV.toString === 'function') return anyV.toString();
  }
  return v;
}

function formatValue(v: unknown): string {
  if (v == null) return pc.dim('(none)');
  // A bare string can be arbitrary chain-set content (e.g. an Identity
  // display name, an on-chain remark) with no syntax constraint — any
  // ordinary account can set it via a normal transaction, no chain
  // compromise needed. Strip control bytes so a raw terminal escape
  // sequence (OSC 8 hyperlink and similar) can't reach the terminal.
  // Structured values (the JSON.stringify branch below) are already
  // safe — JSON.stringify escapes control chars to \uXXXX notation.
  if (typeof v === 'string') return stripControlChars(v);
  return JSON.stringify(v, null, 2)
    .split('\n')
    .map((l, i) => (i === 0 ? l : `  ${l}`))
    .join('\n');
}

