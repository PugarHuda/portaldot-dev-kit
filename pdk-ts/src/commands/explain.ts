/**
 * `pdk-ts explain --module N --error M` — the unique feature.
 * Decode the raw `Module { index, error }` code a Portaldot node
 * prints when it rejects a transaction, into a named error + fix
 * steps from the shared knowledge base.
 *
 * This is what nothing else in the Portaldot ecosystem does. Ports
 * Python `pdk explain` to TypeScript. Pure read-only — no signing,
 * no chain writes. Works against any Substrate/Portaldot node.
 *
 * Also accepts a positional `<pallet>.<error>` form for convenience,
 * skipping the metadata walk entirely and going straight to the KB
 * lookup (useful when you already know the name).
 */

import pc from 'picocolors';
import {getApi, closeApi} from '../core/chain.js';
import {resolveNode} from '../core/config.js';
import {humanizeChainError} from '../core/errors.js';
import {lookup, kbSize, kbPath, indexLookup, indexSize, INDEX_SPEC_NAME, INDEX_SPEC_VERSION} from '../core/kb.js';

export interface ExplainOptions {
  module?: string;
  error?: string;
  name?: string;
  node?: string;
  json?: boolean;
  timeout?: string;
  live?: boolean; // skip offline index, force metadata walk
}

export interface ExplainReport {
  palletIndex: number;
  errorIndex: number;
  palletName: string;
  errorName: string;
  key: string; // `<pallet_lowercased>.<ErrorName>`
  summary: string | null;
  steps: string[];
  kbEntry: boolean;
  source: 'index' | 'metadata' | 'kb-name-only';
  indexFingerprint?: {specName: string; specVersion: number};
  warning?: string;
}

interface VariantsHost {
  registry: {
    lookup: {
      getSiType: (id: number) => {
        def: {
          isVariant: boolean;
          asVariant: {
            variants: Array<{
              name: {toString: () => string};
              index: {toNumber: () => number};
            }>;
          };
        };
      } | undefined;
    };
  };
}

export async function resolve(
  node: string,
  moduleIdx: number,
  errorIdx: number,
  timeoutMs?: number,
): Promise<ExplainReport> {
  const api = await getApi(node, timeoutMs);
  const pallets = api.runtimeMetadata.asLatest.pallets;
  const pallet = pallets.find((p) => p.index.toNumber() === moduleIdx);
  if (!pallet) {
    throw new Error(`No pallet at module index ${moduleIdx} in runtime metadata`);
  }
  if (!pallet.errors.isSome) {
    throw new Error(`Pallet "${pallet.name.toString()}" (index ${moduleIdx}) defines no errors`);
  }
  const errorsRef = pallet.errors.unwrap();
  const typeId = errorsRef.type.toNumber();
  const t = (api as unknown as VariantsHost).registry.lookup.getSiType(typeId);
  if (!t?.def?.isVariant) {
    throw new Error(`Errors type for pallet "${pallet.name.toString()}" is not a variant enum`);
  }
  const variant = t.def.asVariant.variants.find((v) => v.index.toNumber() === errorIdx);
  if (!variant) {
    throw new Error(
      `No error at index ${errorIdx} in pallet "${pallet.name.toString()}" — pallet has ${t.def.asVariant.variants.length} errors`,
    );
  }
  const palletName = pallet.name.toString();
  const errorName = variant.name.toString();
  const key = `${palletName.toLowerCase()}.${errorName}`;
  const kbEntry = lookup(key);
  return {
    palletIndex: moduleIdx,
    errorIndex: errorIdx,
    palletName,
    errorName,
    key,
    summary: kbEntry?.summary ?? null,
    steps: kbEntry?.steps ?? [],
    kbEntry: Boolean(kbEntry),
    source: 'metadata',
  };
}

/**
 * Walk a connected node's runtime metadata and build the
 * `"<pallet_index>.<error_index>"` → `"Pallet.ErrorName"` map that the
 * shipped error index holds — the TS counterpart of Python's
 * `build_live_index`, used by `pdk-ts kb --verify`.
 */
export async function buildLiveIndex(node: string, timeoutMs?: number): Promise<Record<string, string>> {
  const api = await getApi(node, timeoutMs);
  const live: Record<string, string> = {};
  for (const pallet of api.runtimeMetadata.asLatest.pallets) {
    if (!pallet.errors.isSome) continue;
    const palletIdx = pallet.index.toNumber();
    const typeId = pallet.errors.unwrap().type.toNumber();
    const t = (api as unknown as VariantsHost).registry.lookup.getSiType(typeId);
    if (!t?.def?.isVariant) continue;
    for (const v of t.def.asVariant.variants) {
      live[`${palletIdx}.${v.index.toNumber()}`] = `${pallet.name.toString()}.${v.name.toString()}`;
    }
  }
  return live;
}

/** Look up a `<pallet>.<error>` name directly against the KB, no node needed. */
export function resolveByName(name: string): ExplainReport | null {
  const entry = lookup(name);
  if (!entry) return null;
  const [palletName, ...rest] = entry.key.split('.');
  const errorName = rest.join('.');
  return {
    palletIndex: -1,
    errorIndex: -1,
    palletName,
    errorName,
    key: entry.key,
    summary: entry.summary,
    steps: entry.steps,
    kbEntry: true,
    source: 'kb-name-only',
  };
}

export async function run(opts: ExplainOptions): Promise<void> {
  try {
    // Fast-path: --module/--error resolves against the offline index
    // (202 entries, Portaldot-1002 verified) unless --live is passed.
    // Falls back to metadata walk if the index has no matching entry.
    if (opts.module && opts.error && !opts.live) {
      const moduleIdx = Number(opts.module);
      const errorIdx = Number(opts.error);
      if (Number.isInteger(moduleIdx) && moduleIdx >= 0 && Number.isInteger(errorIdx) && errorIdx >= 0) {
        const named = indexLookup(moduleIdx, errorIdx);
        if (named) {
          const [palletName, ...rest] = named.split('.');
          const errorName = rest.join('.');
          const kbEntry = lookup(named);
          output({
            palletIndex: moduleIdx,
            errorIndex: errorIdx,
            palletName,
            errorName,
            key: named.toLowerCase(),
            summary: kbEntry?.summary ?? null,
            steps: kbEntry?.steps ?? [],
            kbEntry: Boolean(kbEntry),
            source: 'index',
            indexFingerprint: {specName: INDEX_SPEC_NAME, specVersion: INDEX_SPEC_VERSION},
            warning: opts.node
              ? `Offline index resolved this against ${INDEX_SPEC_NAME}-${INDEX_SPEC_VERSION}. If your --node points at a different chain the name may be wrong — pass --live to force a metadata walk.`
              : undefined,
          }, opts);
          return;
        }
        if (indexSize() > 0) {
          // Index loaded but no match — fall through to live metadata walk
          // (user is likely querying a chain other than Portaldot-1002)
        }
      }
    }

    // Name-only mode — no node call needed
    if (opts.name && !opts.module && !opts.error) {
      const r = resolveByName(opts.name);
      if (!r) {
        const msg = `no KB entry for "${opts.name}" (KB size: ${kbSize()})`;
        if (opts.json) console.log(JSON.stringify({error: msg, kbPath: kbPath()}, null, 2));
        else {
          console.error(pc.red(`\n  ✗ ${msg}\n`));
          console.error(pc.dim('     Contribute at pdk/data/error_fixes.yaml — 5-line YAML PR.\n'));
        }
        process.exit(1);
      }
      output(r, opts);
      return;
    }

    if (!opts.module || !opts.error) {
      throw new Error(
        'Provide either `--name <pallet>.<error>` OR both `--module <N>` and `--error <M>`',
      );
    }
    const moduleIdx = Number(opts.module);
    const errorIdx = Number(opts.error);
    if (!Number.isInteger(moduleIdx) || moduleIdx < 0) {
      throw new Error(`--module must be a non-negative integer, got ${opts.module}`);
    }
    if (!Number.isInteger(errorIdx) || errorIdx < 0) {
      throw new Error(`--error must be a non-negative integer, got ${opts.error}`);
    }
    const node = resolveNode(opts.node);
    const timeoutMs = opts.timeout ? Math.round(Number(opts.timeout) * 1000) : undefined;
    const report = await resolve(node, moduleIdx, errorIdx, timeoutMs);
    output(report, opts);
  } catch (err) {
    const node = opts.node ? resolveNode(opts.node) : undefined;
    const msg = humanizeChainError(err, node);
    if (opts.json) console.log(JSON.stringify({error: msg}, null, 2));
    else console.error(pc.red(`\n  ✗ explain failed — ${msg}\n`));
    await closeApi();
    process.exit(1);
  }
  await closeApi();
}

function output(r: ExplainReport, opts: ExplainOptions): void {
  if (opts.json) {
    console.log(JSON.stringify(r, null, 2));
    return;
  }
  console.log();
  const idxSuffix = r.palletIndex >= 0 ? pc.dim(`  (module ${r.palletIndex}, error ${r.errorIndex})`) : '';
  console.log(`  ${pc.red('✗')} ${pc.bold(`${r.palletName}.${r.errorName}`)}${idxSuffix}`);
  if (r.warning) {
    console.log();
    console.log(pc.yellow(`  ⚠  ${r.warning}`));
  }
  console.log();
  if (r.kbEntry && r.summary) {
    console.log(pc.dim('  What happened'));
    console.log(`  ${r.summary}`);
    console.log();
    if (r.steps.length > 0) {
      console.log(pc.dim('  How to fix'));
      r.steps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
      });
      console.log();
    }
  } else {
    console.log(pc.yellow('  ⚠  No curated fix in the knowledge base yet.'));
    console.log(pc.dim('     Contribute one at pdk/data/error_fixes.yaml — 5-line YAML PR.'));
    console.log(pc.dim(`     Key to add: ${r.key}`));
    console.log();
  }
}
