/**
 * Runtime configuration shared across commands.
 *
 * Precedence for the node endpoint, highest wins:
 *   1. `--node <ws-url>` CLI flag (parsed in src/index.ts)
 *   2. `PDK_TS_NODE` environment variable
 *   3. `DEFAULT_NODE` below
 *
 * pdk-ts stays chain-agnostic at the type layer — metadata drives the
 * decode; we do not hardcode pallet/error tables. The endpoint just tells
 * us where to fetch that metadata from.
 */

export const DEFAULT_NODE = 'ws://127.0.0.1:9944';

export function resolveNode(cliOverride?: string): string {
  const url = cliOverride ?? process.env.PDK_TS_NODE ?? DEFAULT_NODE;
  validateNodeUrl(url);
  return url;
}

/**
 * Reject obvious typos early instead of letting @polkadot/api spend
 * 15 s trying to connect and then failing with an opaque error.
 * Only accepts `ws://` and `wss://` schemes; anything else throws
 * with a clear next-action.
 */
export function validateNodeUrl(url: string): void {
  if (!url) {
    throw new Error('Node URL is empty. Use --node <ws://host:port> or set PDK_TS_NODE.');
  }
  const m = url.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  if (!m) {
    throw new Error(
      `Node URL "${url}" has no scheme. Expected ws://... or wss://... — e.g. --node ws://127.0.0.1:9944`,
    );
  }
  const scheme = m[1].toLowerCase();
  if (scheme !== 'ws' && scheme !== 'wss') {
    throw new Error(
      `Node URL scheme "${scheme}://" is not a WebSocket. Use ws:// for local, wss:// for public. Got: ${url}`,
    );
  }
}

export const VERSION = '0.2.0-alpha.5';
