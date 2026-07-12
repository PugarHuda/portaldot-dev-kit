/**
 * `pdk-ts assets` — sign Assets pallet operations. This is pdk-ts's actual
 * reason to exist, not just a claim: Python `substrate-interface` cannot
 * sign Assets calls on Portaldot's V13 metadata at all — verified directly
 * against a live node, `Assets.create` from Python fails at the RPC layer
 * with "Invalid Transaction: bad signature" before it even reaches a
 * dispatch error. @polkadot/api signs the same call successfully. `pdk-ts`
 * is the only member of the pair that can do this.
 *
 * Three lifecycle operations — the minimum to create, fund, and move a
 * custom asset: `create`, `mint`, `transfer`. All three submit through
 * send.ts's shared `submitExtrinsic` engine, so they inherit its
 * false-success guard and hang guard for free — no new signing-safety
 * code to get wrong here.
 */

import pc from 'picocolors';
import {Keyring} from '@polkadot/api';
import {getApi, closeApi} from '../core/chain.js';
import {resolveNode} from '../core/config.js';
import {humanizeChainError} from '../core/errors.js';
import {normaliseUri} from './keys.js';
import {resolveRecipient, submitExtrinsic, type TransferOutcome} from './send.js';

export interface AssetsCommonOptions {
  from?: string;
  node?: string;
  timeout?: string;
  json?: boolean;
}

export interface AssetsCreateOptions extends AssetsCommonOptions {
  minBalance?: string;
  admin?: string;
}

export interface AssetsAmountOptions extends AssetsCommonOptions {
  amount?: string;
}

function parseAssetId(raw: string): number {
  // Number('') is 0, not NaN — require a non-empty digit string explicitly
  // so a blank/whitespace id doesn't silently resolve to asset #0.
  if (!/^\d+$/.test(raw.trim())) throw new Error(`invalid asset id "${raw}" — must be a non-negative integer.`);
  return Number(raw.trim());
}

/** Plain non-negative integer amount — Assets pallet units are whole (no fixed decimals convention like POT). */
function parseAssetAmount(raw: string | undefined): bigint {
  if (raw === undefined || !/^\d+$/.test(raw.trim())) throw new Error('Provide a non-negative integer --amount.');
  return BigInt(raw.trim());
}

function emitOutcome(action: string, extra: Record<string, unknown>, outcome: TransferOutcome, json: boolean): boolean {
  const ok = outcome.status === 'success';
  if (json) {
    console.log(JSON.stringify({success: ok, status: outcome.status, tx: outcome.txHash, block: outcome.block, error: outcome.error, ...extra}));
    return ok;
  }
  if (outcome.status === 'success') {
    console.log(pc.green(`\n  ✓ ${action}`));
    console.log(pc.dim(`  tx: ${outcome.txHash}\n`));
  } else if (outcome.status === 'unconfirmed') {
    console.error(pc.yellow(`\n  ⚠ submitted but the outcome couldn't be confirmed — @polkadot/api can't decode Portaldot's result events.`));
    console.error(pc.dim(`  Confirm with Python: pdk debug ${outcome.txHash}\n`));
  } else {
    console.error(pc.red(`\n  ✗ ${action} failed${outcome.error ? ` — ${outcome.error}` : ''}`));
    console.error(pc.dim(`  tx: ${outcome.txHash}\n`));
  }
  return ok;
}

async function withApi<T>(node: string | undefined, timeout: string | undefined, fn: (api: unknown, keyring: Keyring) => Promise<T>): Promise<T> {
  const api = await getApi(resolveNode(node), timeout ? Math.round(Number(timeout) * 1000) : undefined);
  const keyring = new Keyring({type: 'sr25519', ss58Format: 42});
  return fn(api, keyring);
}

export async function runCreate(id: string, opts: AssetsCreateOptions): Promise<void> {
  const node = resolveNode(opts.node);
  try {
    const assetId = parseAssetId(id);
    const minBalance = opts.minBalance !== undefined ? BigInt(opts.minBalance) : 1n;
    const outcome = await withApi(opts.node, opts.timeout, async (api, keyring) => {
      const admin = keyring.addFromUri(normaliseUri(opts.from ?? '//Alice'));
      const adminAddress = opts.admin ? resolveRecipient(keyring, opts.admin) : admin.address;
      // biome-ignore lint/suspicious/noExplicitAny: ApiPromise tx surface.
      const tx = (api as any).tx.assets.create(assetId, adminAddress, minBalance.toString());
      return submitExtrinsic(api, tx, admin);
    });
    const ok = emitOutcome(`created asset #${id}`, {id: Number(id)}, outcome, Boolean(opts.json));
    await closeApi();
    if (!ok) process.exit(1);
  } catch (err) {
    await fail('assets create', err, node, opts.json);
  }
}

export async function runMint(id: string, to: string, opts: AssetsAmountOptions): Promise<void> {
  const node = resolveNode(opts.node);
  try {
    const assetId = parseAssetId(id);
    const amount = parseAssetAmount(opts.amount);
    const outcome = await withApi(opts.node, opts.timeout, async (api, keyring) => {
      const admin = keyring.addFromUri(normaliseUri(opts.from ?? '//Alice'));
      const dest = resolveRecipient(keyring, to);
      // biome-ignore lint/suspicious/noExplicitAny: ApiPromise tx surface.
      const tx = (api as any).tx.assets.mint(assetId, dest, amount.toString());
      return submitExtrinsic(api, tx, admin);
    });
    const ok = emitOutcome(`minted ${opts.amount} of asset #${id} to ${to}`, {id: Number(id), to, amount: opts.amount}, outcome, Boolean(opts.json));
    await closeApi();
    if (!ok) process.exit(1);
  } catch (err) {
    await fail('assets mint', err, node, opts.json);
  }
}

export async function runTransfer(id: string, to: string, opts: AssetsAmountOptions): Promise<void> {
  const node = resolveNode(opts.node);
  try {
    const assetId = parseAssetId(id);
    const amount = parseAssetAmount(opts.amount);
    const outcome = await withApi(opts.node, opts.timeout, async (api, keyring) => {
      const sender = keyring.addFromUri(normaliseUri(opts.from ?? '//Alice'));
      const dest = resolveRecipient(keyring, to);
      // biome-ignore lint/suspicious/noExplicitAny: ApiPromise tx surface.
      const tx = (api as any).tx.assets.transfer(assetId, dest, amount.toString());
      return submitExtrinsic(api, tx, sender);
    });
    const ok = emitOutcome(`transferred ${opts.amount} of asset #${id} to ${to}`, {id: Number(id), to, amount: opts.amount}, outcome, Boolean(opts.json));
    await closeApi();
    if (!ok) process.exit(1);
  } catch (err) {
    await fail('assets transfer', err, node, opts.json);
  }
}

async function fail(action: string, err: unknown, node: string, json?: boolean): Promise<void> {
  const msg = humanizeChainError(err, node);
  if (json) console.log(JSON.stringify({error: msg, endpoint: node}));
  else console.error(pc.red(`\n  ✗ ${action} failed — ${msg}\n`));
  await closeApi();
  process.exit(1);
}
