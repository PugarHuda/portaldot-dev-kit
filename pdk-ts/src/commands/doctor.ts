/**
 * `pdk-ts doctor` — health probe against a Portaldot (or any Substrate) node.
 *
 * Ports the shape of Python `pdk doctor` to TypeScript. Fetches:
 *   - endpoint / chain name / runtime version
 *   - pallet count (from metadata)
 *   - contracts pallet presence (ink! compat signal)
 *   - liveness: is the chain actually producing blocks, not just reachable
 *     (mirrors Python's `--liveness/--no-liveness`, default on)
 *
 * Exit code 0 on success, 1 if the node is unreachable, the metadata
 * fetch fails, or the chain is stalled (liveness check fails).
 */

import pc from 'picocolors';
import {getApi, closeApi} from '../core/chain.js';
import {resolveNode} from '../core/config.js';
import {humanizeChainError, stripControlChars} from '../core/errors.js';

export interface DoctorOptions {
  node?: string;
  json?: boolean;
  timeout?: string; // seconds, from commander
  liveness?: boolean; // default true — commander maps --no-liveness to false
}

export interface DoctorReport {
  endpoint: string;
  chain: string;
  nodeName: string;
  nodeVersion: string;
  specName: string;
  specVersion: number;
  palletCount: number;
  contractsPresent: boolean;
  liveness?: {checked: boolean; producing: boolean; blockBefore: number; blockAfter: number};
}

// A healthy chain advances at least once within one block-time; wait
// longer than a single ~6s block so we don't false-positive "stalled"
// on a chain that just happened to sample between blocks.
const LIVENESS_WAIT_MS = 7_000;

export async function collectReport(
  node: string,
  timeoutMs?: number,
  checkLiveness = true,
): Promise<DoctorReport> {
  const api = await getApi(node, timeoutMs);
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ]);
  const runtimeVersion = api.runtimeVersion;
  const palletCount = api.runtimeMetadata.asLatest.pallets.length;
  const contractsPresent = api.runtimeMetadata.asLatest.pallets.some(
    (p) => p.name.toString().toLowerCase() === 'contracts',
  );

  let liveness: DoctorReport['liveness'];
  if (checkLiveness) {
    const before = (await api.rpc.chain.getHeader()).number.toNumber();
    await new Promise((resolve) => setTimeout(resolve, LIVENESS_WAIT_MS));
    const after = (await api.rpc.chain.getHeader()).number.toNumber();
    liveness = {checked: true, producing: after > before, blockBefore: before, blockAfter: after};
  }

  return {
    endpoint: node,
    chain: chain.toString(),
    nodeName: nodeName.toString(),
    nodeVersion: nodeVersion.toString(),
    specName: runtimeVersion.specName.toString(),
    specVersion: runtimeVersion.specVersion.toNumber(),
    palletCount,
    contractsPresent,
    liveness,
  };
}

export function renderText(r: DoctorReport): string {
  // r.chain/nodeName/nodeVersion/specName are the node's own
  // self-reported RPC strings (system_chain, system_name,
  // system_version, runtime spec name) — free text with no identifier-
  // syntax constraint. A malicious/misconfigured node needs no
  // transaction, no compromise, just its own RPC response to embed a
  // raw terminal escape sequence in front of every user who points
  // `pdk-ts doctor` at it. picocolors doesn't parse markup (unlike
  // Rich) but does not filter control bytes either — strip them here.
  const rows: [string, string][] = [
    ['Endpoint', r.endpoint],
    ['Chain', stripControlChars(r.chain)],
    ['Node', stripControlChars(`${r.nodeName} ${r.nodeVersion}`)],
    ['Runtime', stripControlChars(`${r.specName} ${r.specVersion}`)],
    ['Pallets', String(r.palletCount)],
    [
      'Contracts pallet',
      r.contractsPresent
        ? pc.green('present') + pc.dim(' — ink! contracts supported')
        : pc.yellow('absent'),
    ],
  ];
  const width = Math.max(...rows.map(([k]) => k.length));
  const base = rows.map(([k, v]) => `  ${pc.dim(k.padEnd(width))}  ${v}`).join('\n');
  if (!r.liveness?.checked) return base;
  const {producing, blockBefore, blockAfter} = r.liveness;
  const livenessLine = producing
    ? pc.green('✓ chain is producing blocks') + pc.dim(` (#${blockBefore} → #${blockAfter})`)
    : pc.red(`⚠ chain is stalled at #${blockBefore} — no new blocks are being produced.`);
  return `${base}\n\n  ${livenessLine}`;
}

export async function run(opts: DoctorOptions): Promise<void> {
  const node = resolveNode(opts.node);
  const timeoutMs = opts.timeout ? Math.round(Number(opts.timeout) * 1000) : undefined;
  const checkLiveness = opts.liveness !== false;
  const t0 = Date.now();
  try {
    const report = await collectReport(node, timeoutMs, checkLiveness);
    const dt = Date.now() - t0;
    const stalled = report.liveness?.checked && !report.liveness.producing;
    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log();
      console.log(pc.bold('  pdk-ts doctor  ') + pc.dim(`(${dt} ms)`));
      console.log();
      console.log(renderText(report));
      console.log();
    }
    if (stalled) {
      await closeApi();
      process.exit(1);
    }
  } catch (err) {
    const msg = humanizeChainError(err, node);
    if (opts.json) {
      console.log(JSON.stringify({error: msg, endpoint: node}, null, 2));
    } else {
      console.error(pc.red(`\n  ✗ doctor failed — ${msg}\n`));
      console.error(pc.dim(`  endpoint: ${node}\n`));
    }
    await closeApi();
    // WsProvider keeps sockets alive on connect failure — force clean exit
    // rather than let the event loop hang the process.
    process.exit(1);
  }
  await closeApi();
}
