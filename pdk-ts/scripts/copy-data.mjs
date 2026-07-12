/**
 * Copy the shared knowledge base + error index from pdk/data into
 * dist/pdk-data so the PUBLISHED npm package can find them.
 *
 * Why this exists: kb.ts / seed.ts resolve data from two candidate paths —
 * `../../../pdk/data/...` (repo layout, works in dev) and
 * `../pdk-data/...` next to the built code (published layout). Without this
 * copy the published package ships zero KB data, so offline FailLens
 * (explain/debug/kb/diagnose) silently returns "KB size: 0". A build that
 * skips this is a broken publish, so a missing source file is a hard error.
 */
import {cpSync, mkdirSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, '..', '..', 'pdk', 'data');
const outDir = resolve(here, '..', 'dist', 'pdk-data');

const FILES = ['error_fixes.yaml', 'error_index.json', 'error_index.meta.json', 'seed.example.yaml'];

mkdirSync(outDir, {recursive: true});
for (const f of FILES) {
  const src = resolve(srcDir, f);
  if (!existsSync(src)) {
    console.error(`copy-data: missing source ${src} — cannot ship a package without the KB.`);
    process.exit(1);
  }
  cpSync(src, resolve(outDir, f));
}
console.log(`copy-data: copied ${FILES.length} data files into dist/pdk-data/`);
