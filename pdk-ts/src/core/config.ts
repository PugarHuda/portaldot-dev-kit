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
  return cliOverride ?? process.env.PDK_TS_NODE ?? DEFAULT_NODE;
}

export const VERSION = '0.2.0-alpha.1';
