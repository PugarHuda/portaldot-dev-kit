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
