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

export async function collectAccounts(node: string, all = false): Promise<AccountRow[]> {
  const api = await getApi(node);
  const keyring = new Keyring({type: 'sr25519', ss58Format: 42});

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
      freeBalance: formatBalance(raw),
      freeRaw: raw,
    });
  }
  return rows;
}

function allEmpty(rows: AccountRow[]): boolean {
  return rows.every((r) => r.freeRaw === '0');
}

function formatBalance(raw: string): string {
  // Portaldot uses 12 decimals for POT (same as Substrate default). Present
  // the raw plancks divided by 10^12 with 4 dp so the number is legible.
  if (raw === '0') return '0 POT';
  const decimals = 12;
  const s = raw.padStart(decimals + 1, '0');
  const whole = s.slice(0, -decimals);
  const frac = s.slice(-decimals).slice(0, 4);
  return `${Number(whole).toLocaleString()}.${frac} POT`;
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
