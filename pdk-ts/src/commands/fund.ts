/**
 * `pdk-ts fund` — top up an account with POT from //Alice. Answers the #1
 * question in the hackathon Q&A channel ("how do I get POT?") with a
 * command instead of prose. Thin wrapper over `send`.
 */

import {run as sendRun} from './send.js';

export const DEFAULT_FUND_AMOUNT = '100';

export interface FundOptions {
  amount?: string;
  node?: string;
  timeout?: string;
  json?: boolean;
  dryRun?: boolean;
}

export async function run(to: string, opts: FundOptions): Promise<void> {
  await sendRun(to, {...opts, amount: opts.amount ?? DEFAULT_FUND_AMOUNT, from: '//Alice'});
}
