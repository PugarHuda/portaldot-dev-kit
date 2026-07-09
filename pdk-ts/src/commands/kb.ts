/**
 * `pdk-ts kb` — knowledge base introspection. Three subcommands:
 *
 *   pdk-ts kb                → summary: KB size + index size + coverage %
 *   pdk-ts kb --missing      → list index entries WITHOUT a curated KB entry
 *                              (the community contribution shortlist)
 *   pdk-ts kb --list         → list every KB entry
 *
 * Fully offline — no node required.
 */

import pc from 'picocolors';
import {loadKb, loadIndex, indexSize, kbPath, indexDrift, INDEX_SPEC_NAME, INDEX_SPEC_VERSION} from '../core/kb.js';

export interface KbOptions {
  missing?: boolean;
  list?: boolean;
  json?: boolean;
}

export function run(opts: KbOptions): void {
  const kb = loadKb();
  const index = loadIndex();

  if (opts.missing) {
    reportMissing(kb, index, opts);
    return;
  }
  if (opts.list) {
    reportList(kb, opts);
    return;
  }
  reportSummary(kb, index, opts);
}

function reportMissing(kb: ReturnType<typeof loadKb>, index: Record<string, string>, opts: KbOptions): void {
  const missing: Array<{code: string; name: string; palletIndex: number; errorIndex: number}> = [];
  for (const [code, name] of Object.entries(index)) {
    const key = name.toLowerCase();
    if (!kb.has(key)) {
      const [p, e] = code.split('.').map(Number);
      missing.push({code, name, palletIndex: p, errorIndex: e});
    }
  }
  missing.sort((a, b) => a.name.localeCompare(b.name));

  if (opts.json) {
    console.log(JSON.stringify({schemaVersion: 1, count: missing.length, entries: missing}, null, 2));
    return;
  }

  console.log();
  console.log(pc.bold(`  ${missing.length} errors without a curated fix`) + pc.dim(`  (of ${indexSize()} total in the ${INDEX_SPEC_NAME}-${INDEX_SPEC_VERSION} index)`));
  console.log(pc.dim('  Each entry is a 5-line YAML PR opportunity. See CONTRIBUTING.md.'));
  console.log();
  const nameW = Math.max(...missing.map((m) => m.name.length));
  for (const m of missing.slice(0, 40)) {
    console.log(`  ${pc.dim(m.code.padEnd(8))}  ${pc.cyan(m.name.padEnd(nameW))}`);
  }
  if (missing.length > 40) {
    console.log(pc.dim(`\n  ... and ${missing.length - 40} more. Use --json to get them all.`));
  }
  console.log();
}

function reportList(kb: ReturnType<typeof loadKb>, opts: KbOptions): void {
  const entries = Array.from(kb.values()).sort((a, b) => a.key.localeCompare(b.key));
  if (opts.json) {
    console.log(JSON.stringify({schemaVersion: 1, count: entries.length, entries}, null, 2));
    return;
  }
  console.log();
  console.log(pc.bold(`  ${entries.length} curated KB entries`) + pc.dim(`  (path: ${kbPath()})`));
  console.log();
  for (const e of entries) {
    console.log(`  ${pc.cyan(e.key)}`);
    console.log(`    ${pc.dim(e.summary)}`);
  }
  console.log();
}

function reportSummary(kb: ReturnType<typeof loadKb>, index: Record<string, string>, opts: KbOptions): void {
  const indexEntries = Object.keys(index).length;
  const kbEntries = kb.size;
  const coverage = indexEntries > 0 ? ((kbEntries / indexEntries) * 100).toFixed(1) : '0.0';

  if (opts.json) {
    const drift = indexDrift();
    console.log(JSON.stringify({
      // Bumped when a field is renamed or removed. New fields don't
      // bump — consumers should ignore unknown fields.
      schemaVersion: 1,
      kbPath: kbPath(),
      kbEntries,
      indexEntries,
      indexFingerprint: {specName: INDEX_SPEC_NAME, specVersion: INDEX_SPEC_VERSION},
      driftDetected: drift.drift,
      driftReason: drift.reason,
      coveragePercent: Number(coverage),
    }, null, 2));
    return;
  }

  console.log();
  console.log(pc.bold('  pdk-ts kb'));
  console.log();
  console.log(`  ${pc.dim('KB path        ')}  ${kbPath() ?? pc.yellow('not found')}`);
  console.log(`  ${pc.dim('KB entries     ')}  ${pc.green(String(kbEntries))}`);
  console.log(`  ${pc.dim('Index entries  ')}  ${indexEntries}  ${pc.dim(`(${INDEX_SPEC_NAME}-${INDEX_SPEC_VERSION})`)}`);
  console.log(`  ${pc.dim('KB coverage    ')}  ${pc.cyan(`${coverage}%`)}`);
  console.log();
  console.log(pc.dim('  Subcommands:'));
  console.log(`  ${pc.dim('  --missing')}  list the ${indexEntries - kbEntries} errors without a curated fix`);
  console.log(`  ${pc.dim('  --list   ')}  list every curated entry`);
  console.log();
}
