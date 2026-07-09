/**
 * `pdk-ts diagnose` — tooling health check. When a user reports "pdk-ts
 * broken," this is the first thing to run. Reports:
 *
 *   - pdk-ts version + node version
 *   - KB status: path resolved, entry count
 *   - Offline index: path, spec fingerprint, entry count
 *   - Connectivity: probes the configured node
 *
 * Pure diagnostic — never modifies state, never signs.
 */

import pc from 'picocolors';
import {VERSION, resolveNode} from '../core/config.js';
import {kbPath, kbSize, indexSize, indexDrift, INDEX_SPEC_NAME, INDEX_SPEC_VERSION} from '../core/kb.js';
import {getApi, closeApi} from '../core/chain.js';

export interface DiagnoseOptions {
  node?: string;
  json?: boolean;
  timeout?: string;
  skipConnect?: boolean;
}

export interface DiagnoseReport {
  pdkTs: {version: string; nodeVersion: string; platform: string};
  kb: {path: string | null; entries: number};
  index: {loaded: boolean; entries: number; specName: string; specVersion: number; driftDetected: boolean; driftReason?: string};
  connectivity: {endpoint: string; ok: boolean; error?: string; chain?: string; palletCount?: number};
}

export async function collect(opts: DiagnoseOptions): Promise<DiagnoseReport> {
  const node = resolveNode(opts.node);
  const timeoutMs = opts.timeout ? Math.round(Number(opts.timeout) * 1000) : 8000;

  const drift = indexDrift();
  const report: DiagnoseReport = {
    pdkTs: {
      version: VERSION,
      nodeVersion: process.version,
      platform: `${process.platform} ${process.arch}`,
    },
    kb: {path: kbPath(), entries: kbSize()},
    index: {
      loaded: indexSize() > 0,
      entries: indexSize(),
      specName: INDEX_SPEC_NAME,
      specVersion: INDEX_SPEC_VERSION,
      driftDetected: drift.drift,
      driftReason: drift.reason,
    },
    connectivity: {endpoint: node, ok: false},
  };

  if (opts.skipConnect) {
    report.connectivity.error = 'skipped';
    return report;
  }

  try {
    const api = await getApi(node, timeoutMs);
    const chain = await api.rpc.system.chain();
    report.connectivity.ok = true;
    report.connectivity.chain = chain.toString();
    report.connectivity.palletCount = api.runtimeMetadata.asLatest.pallets.length;
  } catch (err) {
    report.connectivity.error = err instanceof Error ? err.message : String(err);
  }

  return report;
}

export async function run(opts: DiagnoseOptions): Promise<void> {
  const report = await collect(opts);

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
    await closeApi();
    process.exit(report.connectivity.ok || opts.skipConnect ? 0 : 1);
  }

  console.log();
  console.log(pc.bold('  pdk-ts diagnose'));
  console.log();
  console.log(pc.dim('  Tool'));
  console.log(`    version   ${pc.green(report.pdkTs.version)}`);
  console.log(`    node      ${report.pdkTs.nodeVersion}`);
  console.log(`    platform  ${report.pdkTs.platform}`);
  console.log();
  console.log(pc.dim('  Knowledge base'));
  console.log(`    path      ${report.kb.path ?? pc.yellow('not found')}`);
  console.log(`    entries   ${report.kb.entries > 0 ? pc.green(String(report.kb.entries)) : pc.yellow('0 (KB missing or empty)')}`);
  console.log();
  console.log(pc.dim('  Offline error index'));
  console.log(`    loaded    ${report.index.loaded ? pc.green('yes') : pc.yellow('no')}`);
  console.log(`    entries   ${report.index.entries}`);
  console.log(`    fingerprint  ${report.index.specName}-${report.index.specVersion}`);
  if (report.index.driftDetected) {
    console.log(`    ${pc.yellow('drift')}     ${pc.yellow(report.index.driftReason ?? 'sidecar disagrees with code constants')}`);
  }
  console.log();
  console.log(pc.dim('  Connectivity'));
  console.log(`    endpoint  ${report.connectivity.endpoint}`);
  if (report.connectivity.ok) {
    console.log(`    status    ${pc.green('ok')}`);
    console.log(`    chain     ${report.connectivity.chain}`);
    console.log(`    pallets   ${report.connectivity.palletCount}`);
  } else if (report.connectivity.error === 'skipped') {
    console.log(`    status    ${pc.dim('skipped (--skip-connect)')}`);
  } else {
    console.log(`    status    ${pc.red('unreachable')}`);
    console.log(`    error     ${report.connectivity.error}`);
  }
  console.log();

  await closeApi();
  process.exit(report.connectivity.ok || opts.skipConnect ? 0 : 1);
}
