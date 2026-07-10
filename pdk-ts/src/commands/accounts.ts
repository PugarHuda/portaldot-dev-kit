/**
 * `pdk-ts accounts` — enumerate the dev accounts known to a Substrate/
 * Portaldot node and their current POT balance. Same shape as Python
 * `pdk accounts`.
 *
 * v0.2.0-alpha.1: read-only. Uses `//Alice`, `//Bob`, `//Charlie` — the
 * three pre-funded accounts every Substrate dev chain ships with. Balance
 * comes from `system.account(addr).data.free`.
 *
 * Signing / transfer support lands in v0.2.0-alpha.2 alongside `pdk-ts
 * send` — that is the whole point of the TypeScript companion.
 */

import pc from 'picocolors';
import {Keyring} from '@polkadot/api';
import {getApi, closeApi} from '../core/chain.js';
import {resolveNode} from '../core/config.js';
import {humanizeChainError} from '../core/errors.js';

const DEV_ACCOUNTS_DEFAULT = ['//Alice', '//Bob', '//Charlie'] as const;
const DEV_ACCOUNTS_ALL = ['//Alice', '//Bob', '//Charlie', '//Dave', '//Eve', '//Ferdie'] as const;

export interface AccountsOptions {
  node?: string;
  json?: boolean;
  all?: boolean;
}

interface AccountRow {
  name: string;
  uri: string;
  address: string;
  freeBalance: string;
  freeRaw: string;
}

// Portaldot POT uses 14 decimals — the project's established convention,
// matching Python pdk's POT_DECIMALS=14. Crucially, the Portaldot chain
// spec does NOT declare token decimals at all (`system.properties`
// tokenDecimals is null — verified against a live portaldot-1002 node),
// so `registry.chainDecimals` returns @polkadot/api's *default* of 12,
// NOT a value Portaldot actually chose. Trusting that default made every
// balance display 100x off and disagree with the Python CLI. We therefore
// use 14 unless the chain EXPLICITLY declares its own decimals via
// properties (which honors a chain that does set them — e.g. Polkadot's
// 10 — without being misled by the silent-chain default).
const POT_DECIMALS = 14;

async function resolveDecimals(api: {rpc: {system: {properties: () => Promise<unknown>}}}): Promise<number> {
  try {
    const props = (await api.rpc.system.properties()) as {
      tokenDecimals?: {isSome?: boolean; unwrapOr?: (d: unknown) => {toArray?: () => Array<{toNumber: () => number}>}};
    };
    const td = props.tokenDecimals;
    if (td?.isSome) {
      const arr = td.unwrapOr?.(null)?.toArray?.();
      const first = arr?.[0]?.toNumber();
      if (typeof first === 'number' && first > 0) return first;
    }
  } catch {
    // properties unavailable — fall through to the Portaldot convention.
  }
  return POT_DECIMALS;
}

export async function collectAccounts(node: string, all = false): Promise<AccountRow[]> {
  const api = await getApi(node);
  const keyring = new Keyring({type: 'sr25519', ss58Format: 42});
  const decimals = await resolveDecimals(api as {rpc: {system: {properties: () => Promise<unknown>}}});

  const uris = all ? DEV_ACCOUNTS_ALL : DEV_ACCOUNTS_DEFAULT;
  const rows: AccountRow[] = [];
  for (const uri of uris) {
    const pair = keyring.addFromUri(uri);
    const info = await api.query.system.account(pair.address);
    const data = (info as unknown as {data: {free: {toString: () => string}}}).data;
    const raw = data.free.toString();
    rows.push({
      name: uri.replace('//', ''),
      uri,
      address: pair.address,
      freeBalance: formatBalance(raw, decimals),
      freeRaw: raw,
    });
  }
  return rows;
}

function allEmpty(rows: AccountRow[]): boolean {
  return rows.every((r) => r.freeRaw === '0');
}

export function formatBalance(raw: string, decimals: number = POT_DECIMALS): string {
  // Present raw plancks divided by 10^decimals with 4 dp so the number
  // is legible. `decimals` comes from the chain registry at the call
  // site; the default is the verified Portaldot value, not 12.
  if (raw === '0') return '0 POT';
  const s = raw.padStart(decimals + 1, '0');
  const whole = s.slice(0, -decimals);
  const frac = s.slice(-decimals).slice(0, 4);
  // toLocaleString with an explicit en-US locale so the thousands
  // separator is a comma everywhere — otherwise the output differs by
  // the runner's locale (e.g. "1.000.000" on a de-DE machine).
  return `${Number(whole).toLocaleString('en-US')}.${frac} POT`;
}

export async function run(opts: AccountsOptions): Promise<void> {
  const node = resolveNode(opts.node);
  try {
    const rows = await collectAccounts(node, opts.all);
    if (opts.json) {
      console.log(JSON.stringify(rows, null, 2));
    } else {
      console.log();
      console.log(pc.bold('  pdk-ts accounts  ') + pc.dim(`(${rows.length} dev accounts)`));
      console.log();
      const nameW = Math.max(...rows.map((r) => r.name.length), 7);
      const addrW = Math.max(...rows.map((r) => r.address.length));
      console.log(
        `  ${pc.dim('name'.padEnd(nameW))}  ${pc.dim('address'.padEnd(addrW))}  ${pc.dim('free')}`,
      );
      for (const r of rows) {
        console.log(
          `  ${r.name.padEnd(nameW)}  ${pc.cyan(r.address.padEnd(addrW))}  ${pc.green(r.freeBalance)}`,
        );
      }
      console.log();
      if (allEmpty(rows)) {
        console.log(
          pc.yellow(
            '  ⚠  All zero balances — this endpoint is likely a public chain (mainnet/testnet)',
          ),
        );
        console.log(
          pc.dim(
            '     rather than a local dev node. //Alice/Bob/Charlie are pre-funded only on `--dev` chains.',
          ),
        );
        console.log(
          pc.dim(
            '     Point pdk-ts at a local Portaldot node: `pdk-ts accounts --node ws://127.0.0.1:9944`',
          ),
        );
      } else {
        console.log(pc.dim('  Pre-funded at genesis. Use them for gas — no faucet needed.'));
      }
      console.log();
    }
  } catch (err) {
    const msg = humanizeChainError(err, node);
    if (opts.json) {
      console.log(JSON.stringify({error: msg, endpoint: node}, null, 2));
    } else {
      console.error(pc.red(`\n  ✗ accounts failed — ${msg}\n`));
      console.error(pc.dim(`  endpoint: ${node}\n`));
    }
    await closeApi();
    process.exit(1);
  }
  await closeApi();
}
