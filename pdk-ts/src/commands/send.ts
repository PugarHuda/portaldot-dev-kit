/**
 * `pdk-ts send` — submit a REAL POT transfer (transferKeepAlive).
 *
 * The signing tier: pdk-ts's reason to exist alongside Python is to sign
 * on Portaldot's metadata where Python's substrate-interface can't. This
 * composes, signs, and submits a transfer, then reports the tx hash and
 * whether it dispatched successfully.
 *
 * Safety: `--from` defaults to //Alice (a dev account). A dispatch
 * failure is reported; if @polkadot/api can't decode the failure reason
 * on Portaldot (the known event-decode limitation), it points the user
 * at Python `pdk debug <hash>` which decodes it reliably.
 */

import pc from 'picocolors';
import {Keyring} from '@polkadot/api';
import {getApi, closeApi} from '../core/chain.js';
import {resolveNode} from '../core/config.js';
import {humanizeChainError, stripControlChars} from '../core/errors.js';
import {normaliseUri} from './keys.js';
import {predictOutcome} from './simulate.js';

const POT_DECIMALS = 14;

export interface SendOptions {
  amount?: string;
  from?: string;
  node?: string;
  timeout?: string;
  json?: boolean;
  dryRun?: boolean;
}

/**
 * True only for a plain decimal amount (`5`, `2.3`, `0.5`). Rejects
 * scientific notation (`1e3`), hex, signs, and junk — `Number.isFinite`
 * would accept `1e3`, but `potToPlancks` does `BigInt("1e3")` which throws,
 * so validate on this before parsing to give a clear error not a raw crash.
 */
export function isPlainDecimalAmount(s: string): boolean {
  return /^\d+(\.\d+)?$/.test(s.trim());
}

/** Exact POT → integer plancks (BigInt, no float rounding). */
export function potToPlancks(amount: string): bigint {
  const [whole, frac = ''] = amount.trim().replace(/^-/, '').split('.');
  const fracPadded = (frac + '0'.repeat(POT_DECIMALS)).slice(0, POT_DECIMALS);
  return BigInt(whole || '0') * 10n ** BigInt(POT_DECIMALS) + BigInt(fracPadded || '0');
}

export interface TransferOutcome {
  txHash: string;
  block: string;
  status: 'success' | 'failed' | 'unconfirmed';
  error: string | null;
}

/**
 * Resolve a transfer recipient — deliberately STRICTER than `keys`'
 * `normaliseUri`. On a money command a bare word like `NOTANADDRESS` is far
 * more likely a typo or a mangled address than a deliberate `//NOTANADDRESS`
 * dev-derivation, and silently deriving one and sending real POT to it is a
 * black-hole footgun (verified: it reported success while the money left).
 *
 * So: an explicit `//URI` (or a git-bash-mangled `/URI`) derives an account;
 * anything else MUST be a valid SS58 address (checked, not assumed). A bare
 * word that is neither is a hard error — use `//Name` to mean a dev account.
 */
export function resolveRecipient(keyring: Keyring, to: string): string {
  const s = to.trim();
  if (s.startsWith('//')) return keyring.addFromUri(s).address;
  if (s.startsWith('/')) return keyring.addFromUri(`/${s}`).address; // git-bash mangled //
  try {
    keyring.decodeAddress(s); // throws if not a valid SS58 address
    return s;
  } catch {
    throw new Error(`"${to}" is not a valid SS58 address or //derivation URI — to send to a dev account use its //URI (e.g. //Bob).`);
  }
}

/** Best-effort decode of a dispatch error; null if @polkadot/api can't. */
function decodeDispatchError(api: {registry: {findMetaError: (m: unknown) => {section: string; name: string}}}, dispatchError: {isModule?: boolean; asModule?: unknown; type?: string}): string | null {
  try {
    if (dispatchError.isModule) {
      const meta = api.registry.findMetaError(dispatchError.asModule);
      const section = meta.section ? meta.section[0].toUpperCase() + meta.section.slice(1) : meta.section;
      return stripControlChars(`${section}.${meta.name}`);
    }
    return stripControlChars(dispatchError.type ?? 'DispatchError');
  } catch {
    return null;
  }
}

/**
 * Sign + submit a transferKeepAlive and detect the outcome honestly.
 *
 * Success is confirmed ONLY by a positive `system.ExtrinsicSuccess` event,
 * never by the mere absence of a dispatchError — @polkadot/api cannot decode
 * Portaldot's events in a FAILED block, so trusting "no error" reports a
 * failed transfer as sent (a verified false-success on a money path). Shared
 * by `send` (one transfer) and `seed` (many).
 */
/** Max wait for block inclusion before reporting `unconfirmed`. */
export const SUBMIT_TIMEOUT_MS = 60_000;

/**
 * Sign + submit ANY pre-composed extrinsic and detect the outcome honestly.
 * The engine `send`/`seed` (balances.transferKeepAlive) and `assets` (Assets
 * pallet calls) all submit through — one place that owns the false-success
 * guard and the hang guard, so every signing command inherits both for free.
 *
 * Success is confirmed ONLY by a positive `system.ExtrinsicSuccess` event,
 * never by the mere absence of a dispatchError — @polkadot/api cannot decode
 * Portaldot's events in a FAILED block, so trusting "no error" reports a
 * failed transfer as sent (a verified false-success on a money path).
 */
export function submitExtrinsic(
  // biome-ignore lint/suspicious/noExplicitAny: ApiPromise surface is broad; the fields we touch are guarded at runtime.
  api: any,
  // biome-ignore lint/suspicious/noExplicitAny: SubmittableExtrinsic — varies per call, checked at runtime.
  tx: any,
  // biome-ignore lint/suspicious/noExplicitAny: KeyringPair.
  sender: any,
  timeoutMs: number = SUBMIT_TIMEOUT_MS,
): Promise<TransferOutcome> {
  return new Promise<TransferOutcome>((resolve, reject) => {
    // signAndSend only fires our callback on the statuses we act on; a tx
    // that is dropped/invalid/usurped or a node that never authors a block
    // would otherwise leave this promise pending forever (a CLI hang on a
    // money command). Guard every terminal outcome and cap the wait.
    let settled = false;
    // biome-ignore lint/suspicious/noExplicitAny: unsubscribe fn from signAndSend.
    let unsub: any;
    const settle = (outcome: TransferOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (typeof unsub === 'function') unsub();
      resolve(outcome);
    };

    const timer = setTimeout(
      () => settle({txHash: '', block: '', status: 'unconfirmed', error: `no block inclusion within ${Math.round(timeoutMs / 1000)}s`}),
      timeoutMs,
    );

    tx
      // biome-ignore lint/suspicious/noExplicitAny: signAndSend callback payload.
      .signAndSend(sender, ({status, dispatchError, events, txHash}: any) => {
        // Terminal non-inclusion statuses: the tx will never land in a block.
        if (status.isInvalid || status.isDropped || status.isUsurped || status.isFinalityTimeout) {
          settle({txHash: txHash?.toHex?.() ?? '', block: '', status: 'failed', error: status.type ?? 'not included'});
          return;
        }
        if (!status.isInBlock) return;
        const txh = txHash.toHex();
        const block = status.asInBlock.toHex();

        if (dispatchError) {
          settle({txHash: txh, block, status: 'failed', error: decodeDispatchError(api, dispatchError)});
          return;
        }
        let sawSuccess = false;
        let sawFailure = false;
        try {
          for (const {event} of events as unknown as Array<{event: unknown}>) {
            if (api.events.system.ExtrinsicSuccess.is(event as never)) sawSuccess = true;
            if (api.events.system.ExtrinsicFailed.is(event as never)) sawFailure = true;
          }
        } catch {
          // events undecodable — leave both false → unconfirmed below.
        }
        if (sawSuccess) settle({txHash: txh, block, status: 'success', error: null});
        else if (sawFailure) settle({txHash: txh, block, status: 'failed', error: null});
        else settle({txHash: txh, block, status: 'unconfirmed', error: null});
      })
      .then((u: unknown) => {
        unsub = u;
        // If we already settled (e.g. a fast timeout), tear the sub down now.
        if (settled && typeof unsub === 'function') unsub();
      })
      .catch((err: unknown) => {
        if (!settled) {
          settled = true;
          if (timer) clearTimeout(timer);
          reject(err);
        }
      });
  });
}

/** transferKeepAlive specifically — send/seed's call into the shared engine. */
export function submitTransfer(
  // biome-ignore lint/suspicious/noExplicitAny: ApiPromise surface is broad.
  api: any,
  // biome-ignore lint/suspicious/noExplicitAny: KeyringPair.
  sender: any,
  dest: string,
  value: bigint,
  timeoutMs: number = SUBMIT_TIMEOUT_MS,
): Promise<TransferOutcome> {
  return submitExtrinsic(api, api.tx.balances.transferKeepAlive(dest, value.toString()), sender, timeoutMs);
}

/**
 * Preview the fee + feasibility for THIS exact sender/recipient/amount —
 * reuses simulate's predictOutcome, submits nothing.
 */
async function dryRun(
  // biome-ignore lint/suspicious/noExplicitAny: ApiPromise surface is broad.
  api: any,
  // biome-ignore lint/suspicious/noExplicitAny: KeyringPair.
  sender: any,
  dest: string,
  fromLabel: string,
  toLabel: string,
  amount: number,
  value: bigint,
  json: boolean,
): Promise<void> {
  const tx = api.tx.balances.transferKeepAlive(dest, value.toString());
  const info = await tx.paymentInfo(sender);
  const feeRaw = BigInt(info.partialFee.toString());
  const accountInfo = await api.query.system.account(sender.address);
  const balanceRaw = BigInt(accountInfo.data.free.toString());
  const edRaw = BigInt(api.consts.balances.existentialDeposit.toString());

  const toPot = (raw: bigint) => Number(raw) / 10 ** POT_DECIMALS;
  const fee = toPot(feeRaw);
  const balance = toPot(balanceRaw);
  const ed = toPot(edRaw);
  const {feasible, likelyError} = predictOutcome(amount, fee, balance, ed);

  if (json) {
    console.log(JSON.stringify({dryRun: true, from: fromLabel, to: toLabel, amount, fee, senderBalance: balance, existentialDeposit: ed, feasible, likelyError}));
  } else {
    console.log(`\n  ${pc.bold('pdk-ts send --dry-run')}  ${fromLabel} → ${toLabel}  ${pc.dim('(not submitted)')}`);
    console.log(`  ${pc.dim('Amount'.padEnd(20))}${amount.toLocaleString('en-US')} POT`);
    console.log(`  ${pc.dim('Estimated fee'.padEnd(20))}${fee.toFixed(6)} POT`);
    console.log(`  ${pc.dim('Sender balance'.padEnd(20))}${balance.toLocaleString('en-US')} POT`);
    console.log(`  ${pc.dim('Existential deposit'.padEnd(20))}${ed.toFixed(6)} POT`);
    console.log(`  ${pc.dim('Prediction'.padEnd(20))}${feasible ? pc.green('likely SUCCEED') : pc.red(`would FAIL — ${likelyError}`)}\n`);
  }
  if (!feasible) process.exitCode = 1;
}

export async function run(to: string, opts: SendOptions): Promise<void> {
  const node = resolveNode(opts.node);
  const amountStr = opts.amount;
  const timeoutMs = opts.timeout ? Math.round(Number(opts.timeout) * 1000) : undefined;

  if (amountStr === undefined || !isPlainDecimalAmount(amountStr) || Number(amountStr) <= 0) {
    const msg = 'Provide a positive --amount (POT) as a plain decimal, e.g. 1 or 2.5.';
    if (opts.json) console.log(JSON.stringify({error: msg}));
    else console.error(pc.red(`\n  ✗ ${msg}\n`));
    process.exit(1);
  }

  try {
    const api = await getApi(node, timeoutMs);
    const keyring = new Keyring({type: 'sr25519', ss58Format: 42});
    const sender = keyring.addFromUri(normaliseUri(opts.from ?? '//Alice'));
    const dest = resolveRecipient(keyring, to);
    const value = potToPlancks(String(amountStr));

    if (opts.dryRun) {
      await dryRun(api, sender, dest, opts.from ?? '//Alice', to, Number(amountStr), value, Boolean(opts.json));
      await closeApi();
      return;
    }

    const outcome = await submitTransfer(api, sender, dest, value);

    const ok = outcome.status === 'success';
    if (opts.json) {
      console.log(JSON.stringify({
        success: ok,
        status: outcome.status,
        tx: outcome.txHash,
        block: outcome.block,
        from: opts.from ?? '//Alice',
        to,
        amount: Number(amountStr),
        error: outcome.error,
      }));
    } else if (outcome.status === 'success') {
      console.log(pc.green(`\n  ✓ sent ${Number(amountStr).toLocaleString('en-US')} POT`) + pc.dim(`  ${opts.from ?? '//Alice'} → ${to}`));
      console.log(pc.dim(`  tx: ${outcome.txHash}\n`));
    } else if (outcome.status === 'unconfirmed') {
      console.error(pc.yellow(`\n  ⚠ transfer submitted but the outcome couldn't be confirmed — @polkadot/api can't decode Portaldot's result events.`));
      console.error(pc.dim(`  This usually means it FAILED. Confirm with Python: pdk debug ${outcome.txHash}\n`));
    } else {
      console.error(pc.red(`\n  ✗ transfer failed${outcome.error ? ` — ${outcome.error}` : ''}`));
      console.error(pc.dim(`  tx: ${outcome.txHash}  ·  dig in: pdk debug ${outcome.txHash}\n`));
    }
    await closeApi();
    if (!ok) process.exit(1);
  } catch (err) {
    const msg = humanizeChainError(err, node);
    if (opts.json) console.log(JSON.stringify({error: msg, endpoint: node}));
    else console.error(pc.red(`\n  ✗ send failed — ${msg}\n`));
    await closeApi();
    process.exit(1);
  }
}
