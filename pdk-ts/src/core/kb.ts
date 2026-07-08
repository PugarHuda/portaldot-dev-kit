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

let indexCache: Record<string, string> | null = null;

export function loadIndex(force = false): Record<string, string> {
  if (indexCache && !force) return indexCache;
  const path = INDEX_CANDIDATES.find((p) => existsSync(p));
  if (!path) {
    indexCache = {};
    return indexCache;
  }
  const raw = readFileSync(path, 'utf8');
  indexCache = JSON.parse(raw) as Record<string, string>;
  return indexCache;
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
  if (parsed && typeof parsed === 'object') {
    for (const [key, value] of Object.entries(parsed)) {
      if (!value) continue;
      entries.set(key.toLowerCase(), {
        key,
        summary: value.summary ?? '',
        steps: value.steps ?? [],
      });
    }
  }
  cache = entries;
  return cache;
}

export function lookup(palletDotError: string): KbEntry | undefined {
  return loadKb().get(palletDotError.toLowerCase());
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
