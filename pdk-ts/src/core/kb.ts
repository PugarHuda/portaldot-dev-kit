/**
 * Shared knowledge-base loader. Reads the same YAML file that Python pdk
 * ships and treats as the source of truth — `pdk/data/error_fixes.yaml`
 * — so a fix contributed via PR benefits both CLIs without any manual
 * cross-porting.
 *
 * Path resolution:
 *   1. `PDK_KB_PATH` env var (absolute or relative to cwd)
 *   2. `../pdk/data/error_fixes.yaml` relative to this file (dev layout)
 *   3. `./pdk-data/error_fixes.yaml` next to the built binary (npm publish
 *      layout — file gets copied via `files` in package.json when we
 *      ship 0.2.0 to npm)
 *
 * A missing KB is not fatal — chain-side decoding still works, we just
 * won't have curated summaries and fix steps. Callers should treat KB
 * lookups as best-effort enrichment.
 */

import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse as parseYaml} from 'yaml';

export interface KbEntry {
  key: string; // "<pallet>.<ErrorName>", lowercased pallet
  summary: string;
  steps: string[];
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(__filename);

const CANDIDATES = [
  process.env.PDK_KB_PATH,
  resolve(__dirname, '../../..', 'pdk/data/error_fixes.yaml'),
  resolve(__dirname, '..', 'pdk-data/error_fixes.yaml'),
].filter((p): p is string => Boolean(p));

function findKbFile(): string | null {
  // If the user explicitly set PDK_KB_PATH they mean it — silently
  // falling back to the default when their file is missing hides typos.
  const envPath = process.env.PDK_KB_PATH;
  if (envPath && !existsSync(envPath)) {
    throw new Error(`PDK_KB_PATH="${envPath}" does not exist (set explicitly, so we won't silently fall back).`);
  }
  for (const path of CANDIDATES) {
    if (existsSync(path)) return path;
  }
  return null;
}

/**
 * Verified runtime error index — 202 entries mapping "<pallet_idx>.<err_idx>"
 * → "Pallet.Error" for the offline fast-path in `pdk-ts explain
 * --module N --error M`. Sourced from Python pdk's `error_index.json`
 * which is regenerated from live `portaldot-1002` metadata via
 * `extract_index.py`.
 */
const INDEX_CANDIDATES = [
  process.env.PDK_INDEX_PATH,
  resolve(__dirname, '../../..', 'pdk/data/error_index.json'),
  resolve(__dirname, '..', 'pdk-data/error_index.json'),
].filter((p): p is string => Boolean(p));

function assertEnvIndexPathExists(): void {
  const envPath = process.env.PDK_INDEX_PATH;
  if (envPath && !existsSync(envPath)) {
    throw new Error(`PDK_INDEX_PATH="${envPath}" does not exist (set explicitly, so we won't silently fall back).`);
  }
}

/**
 * Runtime index fingerprint. The bundled `error_index.json` was
 * extracted against `portaldot-1002` — if a caller queries a chain
 * with a different spec version, the fast path may return stale names.
 * The `--live` flag on `pdk-ts explain` forces a metadata walk to
 * bypass. `indexSpecVersion` lets commands surface the mismatch when
 * they know both values.
 */
export const INDEX_SPEC_NAME = 'portaldot';
export const INDEX_SPEC_VERSION = 1002;

interface IndexMeta {
  specName?: string;
  specVersion?: number;
  extractedAt?: string;
}

let indexCache: Record<string, string> | null = null;
let indexMetaCache: IndexMeta | null = null;
let indexFingerprintWarned = false;

export function loadIndex(force = false): Record<string, string> {
  if (indexCache && !force) return indexCache;
  assertEnvIndexPathExists();
  const path = INDEX_CANDIDATES.find((p) => existsSync(p));
  if (!path) {
    indexCache = {};
    return indexCache;
  }
  const raw = readFileSync(path, 'utf8');
  indexCache = JSON.parse(raw) as Record<string, string>;

  // Look for a sidecar meta file next to the index. If present and it
  // disagrees with the compiled-in constants, warn once on stderr —
  // silent drift here would give users a wrong error name, which is
  // exactly the class of bug we cannot afford.
  const metaPath = path.replace(/\.json$/, '.meta.json');
  if (existsSync(metaPath)) {
    try {
      indexMetaCache = JSON.parse(readFileSync(metaPath, 'utf8')) as IndexMeta;
      const s = indexMetaCache.specName?.toLowerCase();
      const v = indexMetaCache.specVersion;
      if (
        !indexFingerprintWarned &&
        typeof s === 'string' &&
        typeof v === 'number' &&
        (s !== INDEX_SPEC_NAME || v !== INDEX_SPEC_VERSION)
      ) {
        indexFingerprintWarned = true;
        process.stderr.write(
          `pdk-ts warning: error_index.json fingerprint (${s}-${v}) drifts from code constants (${INDEX_SPEC_NAME}-${INDEX_SPEC_VERSION}). Regenerate one or the other before shipping.\n`,
        );
      }
    } catch {
      // Corrupt sidecar is not fatal — the index itself still loads.
    }
  }

  return indexCache;
}

/** Meta from the sidecar, or null if the sidecar is missing/unreadable. */
export function indexMeta(): IndexMeta | null {
  if (!indexCache) loadIndex();
  return indexMetaCache;
}

/**
 * True when the sidecar's fingerprint disagrees with our compiled-in
 * constants. Returns false when the sidecar is missing (no drift can
 * be detected). Machine consumers should surface this in their JSON.
 */
export function indexDrift(): {drift: boolean; reason?: string} {
  const meta = indexMeta();
  if (!meta) return {drift: false};
  const s = meta.specName?.toLowerCase();
  const v = meta.specVersion;
  if (typeof s !== 'string' || typeof v !== 'number') return {drift: false};
  if (s === INDEX_SPEC_NAME && v === INDEX_SPEC_VERSION) return {drift: false};
  return {
    drift: true,
    reason: `sidecar reports ${s}-${v}, code constants say ${INDEX_SPEC_NAME}-${INDEX_SPEC_VERSION}`,
  };
}

export function indexLookup(moduleIdx: number, errorIdx: number): string | undefined {
  return loadIndex()[`${moduleIdx}.${errorIdx}`];
}

export function indexSize(): number {
  return Object.keys(loadIndex()).length;
}

/** True when the offline index is safe to use against the given spec. */
export function indexMatchesChain(specName: string, specVersion: number): boolean {
  return specName.toLowerCase() === INDEX_SPEC_NAME && specVersion === INDEX_SPEC_VERSION;
}

let cache: Map<string, KbEntry> | null = null;

export function loadKb(force = false): Map<string, KbEntry> {
  if (cache && !force) return cache;
  const path = findKbFile();
  if (!path) {
    cache = new Map();
    return cache;
  }
  const raw = readFileSync(path, 'utf8');
  const parsed = parseYaml(raw) as
    | Record<string, {summary?: string; steps?: string[]} | null>
    | null;
  const entries = new Map<string, KbEntry>();
  const rejected: string[] = [];
  if (parsed && typeof parsed === 'object') {
    for (const [key, value] of Object.entries(parsed)) {
      if (!value) continue;
      const summary = typeof value.summary === 'string' ? value.summary.trim() : '';
      const steps = Array.isArray(value.steps) ? value.steps.filter((s) => typeof s === 'string' && s.trim().length > 0) : [];
      // A KB entry with no summary or no steps is worse than no entry
      // at all — it would ship an empty diagnosis. Drop it here and
      // surface the rejection on the diagnostic path.
      if (!summary || steps.length === 0) {
        rejected.push(key);
        continue;
      }
      entries.set(key.toLowerCase(), {key, summary, steps});
    }
  }
  if (rejected.length > 0 && process.env.PDK_DEBUG_KB) {
    process.stderr.write(`pdk-ts: skipped ${rejected.length} malformed KB entries: ${rejected.join(', ')}\n`);
  }
  cache = entries;
  return cache;
}

export function lookup(palletDotError: string): KbEntry | undefined {
  const kb = loadKb();
  const key = palletDotError.toLowerCase();
  const exact = kb.get(key);
  if (exact) return exact;

  // Name-only fallback: if the query has no pallet (or the exact
  // pallet.error miss), match on the error name under ANY pallet.
  // Mirrors Python `lookup_fix`'s tier-2 — a user typing
  // `explain --name InsufficientBalance` (forgetting the pallet), or a
  // decode path that couldn't recover the pallet, still resolves.
  // Without this, pdk-ts returned "no KB entry" where Python found one.
  const nameOnly = key.includes('.') ? key.slice(key.lastIndexOf('.') + 1) : key;
  if (!nameOnly) return undefined;
  const suffix = `.${nameOnly}`;
  for (const [k, entry] of kb) {
    if (k === nameOnly || k.endsWith(suffix)) return entry;
  }
  return undefined;
}

export function kbSize(): number {
  return loadKb().size;
}

/**
 * For diagnostics — returns the path we actually loaded from, or null.
 */
export function kbPath(): string | null {
  return findKbFile();
}
