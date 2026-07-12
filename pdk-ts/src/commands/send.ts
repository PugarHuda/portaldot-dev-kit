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

const POT_DECIMALS = 14;

export interface SendOptions {
  amount?: string;
  from?: string;
  node?: string;
  timeout?: string;
  json?: boolean;
}

/** Exact POT → integer plancks (BigInt, no float rounding). */
export function potToPlancks(amount: string): bigint {
  const [whole, frac = ''] = amount.trim().replace(/^-/, '').split('.');
  const fracPadded = (frac + '0'.repeat(POT_DECIMALS)).slice(0, POT_DECIMALS);
  return BigInt(whole || '0') * 10n ** BigInt(POT_DECIMALS) + BigInt(fracPadded || '0');
}

/** Resolve a recipient (//URI or bare name → derive address; SS58 → as-is). */
function resolveRecipient(keyring: Keyring, to: string): string {
  const norm = normaliseUri(to);
  if (norm.startsWith('//') || norm.includes('/')) {
    return keyring.addFromUri(norm).address;
  }
  return norm; // already an SS58 address
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

export async function run(to: string, opts: SendOptions): Promise<void> {
  const node = resolveNode(opts.node);
  const amountStr = opts.amount;
  const timeoutMs = opts.timeout ? Math.round(Number(opts.timeout) * 1000) : undefined;

  if (amountStr === undefined || !Number.isFinite(Number(amountStr)) || Number(amountStr) <= 0) {
    const msg = 'Provide a positive --amount (POT).';
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

    // Success on Portaldot MUST be confirmed by a positive
    // `system.ExtrinsicSuccess` event — NOT merely by the absence of a
    // dispatchError. @polkadot/api cannot decode Portaldot's events in a
    // FAILED block (the known metadata limit), so on failure it yields no
    // dispatchError AND no decodable events. Trusting "no dispatchError"
    // would report a failed transfer as sent — a dangerous false success
    // (verified: a drain-below-ED transfer left the balance untouched yet
    // looked successful). So we require the ExtrinsicSuccess signal;
    // anything else is at best unconfirmed.
    const outcome = await new Promise<{txHash: string; block: string; status: 'success' | 'failed' | 'unconfirmed'; error: string | null}>(
      (resolve, reject) => {
        api.tx.balances
          .transferKeepAlive(dest, value.toString())
          .signAndSend(sender, ({status, dispatchError, events, txHash}) => {
            if (!status.isInBlock) return;
            const txh = txHash.toHex();
            const block = status.asInBlock.toHex();

            // Explicit, decodable dispatch failure (works on chains
            // @polkadot/api decodes fully).
            if (dispatchError) {
              resolve({txHash: txh, block, status: 'failed', error: decodeDispatchError(api as never, dispatchError as never)});
              return;
            }
            // Positive success signal.
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
            if (sawSuccess) resolve({txHash: txh, block, status: 'success', error: null});
            else if (sawFailure) resolve({txHash: txh, block, status: 'failed', error: null});
            else resolve({txHash: txh, block, status: 'unconfirmed', error: null});
          })
          .catch(reject);
      },
    );

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
