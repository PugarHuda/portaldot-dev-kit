/**
 * `pdk-ts pallets` — browse the runtime pallet surface directly from
 * metadata. Ports the Python `pdk pallets` output to TypeScript.
 *
 * Two modes:
 *   - `pdk-ts pallets`             → list all pallets with call/event/error counts
 *   - `pdk-ts pallets <name>`      → detail one pallet: calls + errors listed
 *
 * Metadata comes from `api.runtimeMetadata.asLatest.pallets`, which is
 * the same shape the Python side reads via substrate-interface, so
 * output should match byte-for-byte modulo table styling.
 */

import pc from 'picocolors';
import {getApi, closeApi} from '../core/chain.js';
import {resolveNode} from '../core/config.js';
import {humanizeChainError} from '../core/errors.js';

export interface PalletsOptions {
  node?: string;
  json?: boolean;
  timeout?: string;
}

interface PalletRow {
  name: string;
  calls: number;
  events: number;
  errors: number;
}

interface PalletDetail extends PalletRow {
  callNames: string[];
  errorNames: string[];
}

export async function collectAll(node: string, timeoutMs?: number): Promise<PalletRow[]> {
  const api = await getApi(node, timeoutMs);
  const meta = api.runtimeMetadata.asLatest.pallets;
  return meta.map((p) => ({
    name: p.name.toString(),
    calls: p.calls.isSome ? variantNames(api, p.calls.unwrap()).length : 0,
    events: p.events.isSome ? variantNames(api, p.events.unwrap()).length : 0,
    errors: p.errors.isSome ? variantNames(api, p.errors.unwrap()).length : 0,
  }));
}

export async function collectOne(
  node: string,
  palletName: string,
  timeoutMs?: number,
): Promise<PalletDetail | null> {
  const api = await getApi(node, timeoutMs);
  const target = palletName.toLowerCase();
  const p = api.runtimeMetadata.asLatest.pallets.find(
    (x) => x.name.toString().toLowerCase() === target,
  );
  if (!p) return null;
  return {
    name: p.name.toString(),
    calls: p.calls.isSome ? variantNames(api, p.calls.unwrap()).length : 0,
    events: p.events.isSome ? variantNames(api, p.events.unwrap()).length : 0,
    errors: p.errors.isSome ? variantNames(api, p.errors.unwrap()).length : 0,
    callNames: p.calls.isSome ? variantNames(api, p.calls.unwrap()) : [],
    errorNames: p.errors.isSome ? variantNames(api, p.errors.unwrap()) : [],
  };
}

// Metadata's calls/errors/events fields point at a type index inside the
// SiLookup registry; the variants live inside that type as an Enum. We
// unwrap by looking up the type and reading its Enum variants.
interface VariantsHost {
  registry: {
    lookup: {
      getSiType: (id: number) => {def: {isVariant: boolean; asVariant: {variants: Array<{name: {toString: () => string}}>}}} | undefined;
    };
  };
}

function variantNames(api: VariantsHost, ref: {type: {toNumber: () => number}}): string[] {
  const typeId = ref.type.toNumber();
  const t = api.registry.lookup.getSiType(typeId);
  if (!t?.def?.isVariant) return [];
  return t.def.asVariant.variants.map((v) => v.name.toString());
}

export async function run(
  palletArg: string | undefined,
  opts: PalletsOptions,
): Promise<void> {
  const node = resolveNode(opts.node);
  const timeoutMs = opts.timeout ? Math.round(Number(opts.timeout) * 1000) : undefined;

  try {
    const api = await getApi(node, timeoutMs);
    if (!palletArg) {
      // list all — use variantNames.length for accurate counts
      const rows: PalletRow[] = api.runtimeMetadata.asLatest.pallets.map((p) => ({
        name: p.name.toString(),
        calls: p.calls.isSome ? variantNames(api, p.calls.unwrap()).length : 0,
        events: p.events.isSome ? variantNames(api, p.events.unwrap()).length : 0,
        errors: p.errors.isSome ? variantNames(api, p.errors.unwrap()).length : 0,
      }));

      if (opts.json) {
        console.log(JSON.stringify(rows, null, 2));
      } else {
        renderList(rows);
      }
    } else {
      const detail = await collectOne(node, palletArg, timeoutMs);
      if (!detail) {
        const msg = `pallet "${palletArg}" not found in runtime metadata`;
        if (opts.json) console.log(JSON.stringify({error: msg}, null, 2));
        else console.error(pc.red(`\n  ✗ ${msg}\n`));
        await closeApi();
        process.exit(1);
      }
      if (opts.json) console.log(JSON.stringify(detail, null, 2));
      else renderDetail(detail);
    }
  } catch (err) {
    const msg = humanizeChainError(err, node);
    if (opts.json) console.log(JSON.stringify({error: msg, endpoint: node}, null, 2));
    else console.error(pc.red(`\n  ✗ pallets failed — ${msg}\n`));
    await closeApi();
    process.exit(1);
  }
  await closeApi();
}

function renderList(rows: PalletRow[]): void {
  const nameW = Math.max(6, ...rows.map((r) => r.name.length));
  console.log();
  console.log(pc.bold(`  Portaldot runtime — ${rows.length} pallets`));
  console.log();
  console.log(
    `  ${pc.dim('pallet'.padEnd(nameW))}  ${pc.dim('calls'.padStart(6))}  ${pc.dim('events'.padStart(6))}  ${pc.dim('errors'.padStart(6))}`,
  );
  for (const r of rows) {
    console.log(
      `  ${pc.cyan(r.name.padEnd(nameW))}  ${String(r.calls).padStart(6)}  ${String(r.events).padStart(6)}  ${String(r.errors).padStart(6)}`,
    );
  }
  console.log();
}

function renderDetail(d: PalletDetail): void {
  console.log();
  console.log(pc.bold(`  ${d.name}`) + pc.dim(`  (${d.calls} calls · ${d.events} events · ${d.errors} errors)`));
  console.log();
  if (d.callNames.length > 0) {
    console.log(pc.dim('  Calls'));
    for (const n of d.callNames) console.log(`    ${pc.green(n)}`);
    console.log();
  }
  if (d.errorNames.length > 0) {
    console.log(pc.dim('  Errors'));
    for (const n of d.errorNames) console.log(`    ${pc.red(n)}`);
    console.log();
  }
}

