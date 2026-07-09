/**
 * `pdk-ts doctor` — health probe against a Portaldot (or any Substrate) node.
 *
 * Ports the shape of Python `pdk doctor` to TypeScript. Fetches:
 *   - endpoint / chain name / runtime version
 *   - pallet count (from metadata)
 *   - contracts pallet presence (ink! compat signal)
 *
 * Exit code 0 on success, 1 if the node is unreachable or the metadata
 * fetch fails.
 */

import pc from 'picocolors';
import {getApi, closeApi} from '../core/chain.js';
import {resolveNode} from '../core/config.js';
import {humanizeChainError} from '../core/errors.js';

export interface DoctorOptions {
  node?: string;
  json?: boolean;
  timeout?: string; // seconds, from commander
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
}

export async function collectReport(
  node: string,
  timeoutMs?: number,
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
  return {
    endpoint: node,
    chain: chain.toString(),
    nodeName: nodeName.toString(),
    nodeVersion: nodeVersion.toString(),
    specName: runtimeVersion.specName.toString(),
    specVersion: runtimeVersion.specVersion.toNumber(),
    palletCount,
    contractsPresent,
  };
}

function renderText(r: DoctorReport): string {
  const rows: [string, string][] = [
    ['Endpoint', r.endpoint],
    ['Chain', r.chain],
    ['Node', `${r.nodeName} ${r.nodeVersion}`],
    ['Runtime', `${r.specName} ${r.specVersion}`],
    ['Pallets', String(r.palletCount)],
    [
      'Contracts pallet',
      r.contractsPresent
        ? pc.green('present') + pc.dim(' — ink! contracts supported')
        : pc.yellow('absent'),
    ],
  ];
  const width = Math.max(...rows.map(([k]) => k.length));
  return rows
    .map(([k, v]) => `  ${pc.dim(k.padEnd(width))}  ${v}`)
    .join('\n');
}

export async function run(opts: DoctorOptions): Promise<void> {
  const node = resolveNode(opts.node);
  const timeoutMs = opts.timeout ? Math.round(Number(opts.timeout) * 1000) : undefined;
  const t0 = Date.now();
  try {
    const report = await collectReport(node, timeoutMs);
    const dt = Date.now() - t0;
    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log();
      console.log(pc.bold('  pdk-ts doctor  ') + pc.dim(`(${dt} ms)`));
      console.log();
      console.log(renderText(report));
      console.log();
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
