/**
 * `pdk-ts simulate` — preview a transfer's POT fee + feasibility without
 * sending it. Read-only: composes a `transferKeepAlive` (Alice → Bob),
 * queries the real on-chain fee via `paymentInfo`, reads the sender's
 * balance and the existential deposit, and predicts the outcome.
 *
 * Mirrors Python `pdk simulate`, including the ED-aware feasibility that
 * a naive `amount + fee <= balance` check gets wrong: `transferKeepAlive`
 * refuses to drop the sender below the existential deposit, so the real
 * spendable headroom is `balance - ED`.
 */

import pc from 'picocolors';
import {Keyring} from '@polkadot/api';
import {getApi, closeApi} from '../core/chain.js';
import {resolveNode} from '../core/config.js';
import {humanizeChainError} from '../core/errors.js';

// Portaldot POT uses 14 decimals (chain declares none — project convention).
const POT_DECIMALS = 14;

export interface SimulateOptions {
  amount?: string;
  node?: string;
  timeout?: string;
  json?: boolean;
}

export interface SimulateResult {
  amount: number;
  fee: number;
  weight: string;
  senderBalance: number;
  existentialDeposit: number;
  feasible: boolean;
  likelyError: string;
}

/**
 * Predict whether a `transferKeepAlive` of `amount` POT would succeed.
 * Pure — same two failure modes + error names as Python's predict_outcome.
 */
export function predictOutcome(
  amount: number,
  fee: number,
  balance: number,
  existentialDeposit: number,
): {feasible: boolean; likelyError: string} {
  const total = amount + fee;
  if (total > balance) return {feasible: false, likelyError: 'Balances.InsufficientBalance'};
  if (balance - total < existentialDeposit) return {feasible: false, likelyError: 'Balances.KeepAlive'};
  return {feasible: true, likelyError: ''};
}

/** Exact POT → integer plancks (BigInt, no float rounding). */
export function potToPlancks(amount: string): bigint {
  const neg = amount.trim().startsWith('-');
  const [whole, frac = ''] = amount.trim().replace(/^-/, '').split('.');
  const fracPadded = (frac + '0'.repeat(POT_DECIMALS)).slice(0, POT_DECIMALS);
  const plancks = BigInt(whole || '0') * 10n ** BigInt(POT_DECIMALS) + BigInt(fracPadded || '0');
  return neg ? -plancks : plancks;
}

function toPot(raw: bigint): number {
  return Number(raw) / 10 ** POT_DECIMALS;
}

export async function collect(node: string, amount: number, timeoutMs?: number): Promise<SimulateResult> {
  const api = await getApi(node, timeoutMs);
  const keyring = new Keyring({type: 'sr25519', ss58Format: 42});
  const alice = keyring.addFromUri('//Alice');
  const bob = keyring.addFromUri('//Bob');

  const value = potToPlancks(String(amount));
  const tx = api.tx.balances.transferKeepAlive(bob.address, value.toString());
  const info = await tx.paymentInfo(alice);
  const feeRaw = BigInt(info.partialFee.toString());

  const accountInfo = await api.query.system.account(alice.address);
  const balanceRaw = BigInt((accountInfo as unknown as {data: {free: {toString: () => string}}}).data.free.toString());

  const edConst = api.consts.balances.existentialDeposit;
  const edRaw = BigInt(edConst.toString());

  const feePot = toPot(feeRaw);
  const balancePot = toPot(balanceRaw);
  const edPot = toPot(edRaw);
  const {feasible, likelyError} = predictOutcome(amount, feePot, balancePot, edPot);

  return {
    amount,
    fee: feePot,
    weight: info.weight.toString(),
    senderBalance: balancePot,
    existentialDeposit: edPot,
    feasible,
    likelyError,
  };
}

export async function run(opts: SimulateOptions): Promise<void> {
  const node = resolveNode(opts.node);
  const amount = opts.amount !== undefined ? Number(opts.amount) : 1;
  const timeoutMs = opts.timeout ? Math.round(Number(opts.timeout) * 1000) : undefined;

  if (!Number.isFinite(amount) || amount < 0) {
    const msg = 'Amount must be a non-negative number.';
    if (opts.json) console.log(JSON.stringify({error: msg}));
    else console.error(pc.red(`\n  ✗ ${msg}\n`));
    process.exit(1);
  }

  try {
    const r = await collect(node, amount, timeoutMs);
    if (opts.json) {
      console.log(JSON.stringify(r));
      await closeApi();
      return;
    }
    console.log();
    console.log(pc.bold('  pdk-ts simulate') + pc.dim('  (transfer preview — not submitted)'));
    console.log();
    const rows: [string, string][] = [
      ['From', 'Alice → Bob'],
      ['Amount', `${r.amount.toLocaleString('en-US')} POT`],
      ['Estimated fee', `${r.fee.toFixed(6)} POT`],
      ['Weight', r.weight],
      ['Sender balance', `${r.senderBalance.toLocaleString('en-US')} POT`],
      ['Existential deposit', `${r.existentialDeposit.toFixed(6)} POT`],
      [
        'Prediction',
        r.feasible
          ? pc.green('likely SUCCEED')
          : pc.red(`would FAIL — ${r.likelyError}`),
      ],
    ];
    const w = Math.max(...rows.map(([k]) => k.length));
    for (const [k, v] of rows) console.log(`  ${pc.dim(k.padEnd(w))}  ${v}`);
    console.log();
    console.log(pc.dim('  Nothing was submitted. Outcome estimated from the real fee + balance.'));
    console.log();
  } catch (err) {
    const msg = humanizeChainError(err, node);
    if (opts.json) console.log(JSON.stringify({error: msg, endpoint: node}));
    else console.error(pc.red(`\n  ✗ simulate failed — ${msg}\n`));
    await closeApi();
    process.exit(1);
  }
  await closeApi();
}
