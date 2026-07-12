/**
 * `pdk-ts keys` — inspect or generate a Substrate keypair on the
 * Portaldot SS58 format (42). Ports Python `pdk keys` behavior.
 *
 * Modes:
 *   `pdk-ts keys //Alice`            — inspect a URI (dev-derivation)
 *   `pdk-ts keys "<mnemonic>"`       — inspect a 12/24-word phrase
 *   `pdk-ts keys` (no arg)           — generate a fresh mnemonic + show
 *                                      the derived address (warns to
 *                                      store the mnemonic).
 *
 * No network call — everything is local crypto via @polkadot/keyring +
 * @polkadot/util-crypto. Safe to run without a Portaldot node.
 */

import pc from 'picocolors';
import {Keyring} from '@polkadot/api';
import {cryptoWaitReady, mnemonicGenerate} from '@polkadot/util-crypto';
import {u8aToHex} from '@polkadot/util';

const SS58 = 42;

export interface KeysOptions {
  words?: string; // "12" | "15" | "18" | "21" | "24"
  json?: boolean;
}

interface KeyReport {
  label: string;
  address: string;
  publicKey: string;
  type: string;
  mnemonic?: string;
}

function isMnemonic(s: string): boolean {
  const words = s.trim().split(/\s+/);
  return [12, 15, 18, 21, 24].includes(words.length);
}

// Normalise URI input to tolerate common shell mangling. Git Bash on
// Windows strips a leading slash from `//Alice` → `/Alice`; PowerShell
// preserves it. We accept `//Alice`, `/Alice`, and bare `Alice` as
// equivalent, all resolving to `//Alice` for the keyring.
export function normaliseUri(input: string): string {
  const s = input.trim();
  if (s.startsWith('//')) return s;
  if (s.startsWith('/')) return `/${s}`;
  // bare identifier, no slashes — treat as hard-derivation dev URI
  if (/^[A-Za-z][A-Za-z0-9_]*$/.test(s)) return `//${s}`;
  return s;
}

// Windows git-bash / MSYS translates `//Alice` into a Windows path like
// `C:/Program Files/Git/Alice` before pdk-ts ever sees it. If we detect
// the tell-tale shape, hint at the actual fix instead of failing with a
// cryptic "invalid URI".
function detectGitBashMangling(input: string): string | null {
  const s = input.trim();
  const m = s.match(/^[A-Z]:[\\/](?:Program Files[\\/])?Git[\\/](.+)$/i);
  if (!m) return null;
  const tail = m[1];
  return `looks like git-bash rewrote a path — pass "//${tail}" or bare "${tail}" (or set MSYS_NO_PATHCONV=1)`;
}

async function fromUri(uri: string): Promise<KeyReport> {
  await cryptoWaitReady();
  const normalised = normaliseUri(uri);
  const kr = new Keyring({type: 'sr25519', ss58Format: SS58});
  const pair = kr.addFromUri(normalised);
  return {
    label: normalised,
    address: pair.address,
    publicKey: u8aToHex(pair.publicKey),
    type: 'sr25519',
  };
}

async function fromMnemonic(m: string): Promise<KeyReport> {
  await cryptoWaitReady();
  const kr = new Keyring({type: 'sr25519', ss58Format: SS58});
  const pair = kr.addFromMnemonic(m);
  return {
    label: 'mnemonic',
    address: pair.address,
    publicKey: u8aToHex(pair.publicKey),
    type: 'sr25519',
  };
}

type WordCount = 12 | 15 | 18 | 21 | 24;

async function generate(words: WordCount): Promise<KeyReport> {
  await cryptoWaitReady();
  const mnemonic = mnemonicGenerate(words);
  const r = await fromMnemonic(mnemonic);
  return {...r, label: 'generated', mnemonic};
}

export async function run(source: string | undefined, opts: KeysOptions): Promise<void> {
  try {
    let report: KeyReport;
    if (!source) {
      const words = Number(opts.words ?? '12');
      if (![12, 15, 18, 21, 24].includes(words)) {
        throw new Error(`--words must be one of 12/15/18/21/24, got ${words}`);
      }
      report = await generate(words as 12 | 15 | 18 | 21 | 24);
    } else if (isMnemonic(source)) {
      report = await fromMnemonic(source);
    } else {
      // treat as URI (//Alice, //Bob/soft, etc.)
      report = await fromUri(source);
    }

    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      renderText(report);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const hint = source ? detectGitBashMangling(source) : null;
    if (opts.json) console.log(JSON.stringify(hint ? {error: msg, hint} : {error: msg}, null, 2));
    else {
      console.error(pc.red(`\n  ✗ keys failed — ${msg}`));
      if (hint) console.error(pc.yellow(`    hint: ${hint}`));
      console.error();
    }
    process.exit(1);
  }
}

function renderText(r: KeyReport): void {
  console.log();
  console.log(pc.bold(`  keypair — ${r.label}`));
  console.log();
  const rows: [string, string][] = [
    ['SS58 address', pc.cyan(r.address)],
    ['Public key', pc.dim(r.publicKey)],
    ['Type', r.type],
  ];
  if (r.mnemonic) rows.push(['Mnemonic', pc.yellow(r.mnemonic)]);
  const w = Math.max(...rows.map(([k]) => k.length));
  for (const [k, v] of rows) console.log(`  ${pc.dim(k.padEnd(w))}  ${v}`);
  console.log();
  if (r.mnemonic) {
    console.log(pc.yellow('  ⚠  Store the mnemonic securely — it controls the account.'));
    console.log();
  }
}
