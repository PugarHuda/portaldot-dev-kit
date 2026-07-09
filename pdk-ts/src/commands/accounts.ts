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

// Portaldot uses 14 decimals for POT — verified against a live
// portaldot-1002 node (this matches the Python pdk's POT_DECIMALS=14).
// It is NOT the generic Substrate default of 12; assuming 12 makes every
// balance display 100x too large. We still prefer the chain's own
// `registry.chainDecimals` when connected, so the value is never a
// stale guess; this constant is only the offline fallback.
const POT_DECIMALS_FALLBACK = 14;

function chainDecimals(api: {registry?: {chainDecimals?: number[]}}): number {
  const d = api.registry?.chainDecimals?.[0];
  return typeof d === 'number' && d > 0 ? d : POT_DECIMALS_FALLBACK;
}

export async function collectAccounts(node: string, all = false): Promise<AccountRow[]> {
  const api = await getApi(node);
  const keyring = new Keyring({type: 'sr25519', ss58Format: 42});
  const decimals = chainDecimals(api as {registry?: {chainDecimals?: number[]}});

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

export function formatBalance(raw: string, decimals: number = POT_DECIMALS_FALLBACK): string {
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
