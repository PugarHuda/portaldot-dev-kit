/**
 * Cross-command error rendering.
 *
 * Raw `@polkadot/api` errors read like `Received network error or
 * non-101 status code.` — technically correct, actionably useless.
 * `humanizeChainError()` maps the shapes we've seen users trip on to
 * one line they can act on.
 *
 * Fall-through: unknown shapes pass the original message unchanged, so
 * we never hide real information — only annotate common cases.
 */

// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — this IS the control-character filter.
const CONTROL_CHARS = /[\x00-\x08\x0b-\x1f\x7f]/g;

/**
 * Strip ASCII control characters (keeps \t and \n) from chain-sourced
 * free text before it reaches a real terminal.
 *
 * The range `\x0b-\x1f` INCLUDES `\x1b` (ESC, 27), so ANSI/OSC escape
 * sequences are neutralised — the ESC byte that starts an OSC 8 clickable
 * hyperlink (or a colour/cursor sequence) is removed, so a node's
 * self-reported `system_chain` name, a pallet/error name from a
 * malicious/fake RPC server, or free-form storage content any ordinary
 * account can set cannot inject escapes into pdk-ts's own output.
 * picocolors (unlike Rich) also never parses `[tag]`-style markup from
 * string content, so there's no Rich-markup-injection class to worry about.
 *
 * Deliberately preserved: `\t` and `\n`. A crafted chain string containing
 * a newline could still spoof an extra output line — acceptable here because
 * the values passed through this are short identifiers (chain/pallet/error
 * names), not multi-line blobs. Mirrors Python's `decoder.strip_control_chars`.
 */
export function stripControlChars(text: string): string {
  return text.replace(CONTROL_CHARS, '');
}

export function readableError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    const e = err as {message?: string; error?: {message?: string}; type?: string; code?: string};
    if (typeof e.message === 'string' && e.message.length > 0) return e.message;
    if (typeof e.error?.message === 'string') return e.error.message;
    if (typeof e.type === 'string') return `network event: ${e.type}`;
    if (typeof e.code === 'string') return e.code;
    try {
      return JSON.stringify(err);
    } catch {
      /* fall through */
    }
  }
  return String(err);
}

/**
 * Enrich a raw chain-connect error with an actionable hint. Never drops
 * the original message — always appends ` — <hint>` when we recognise
 * the shape.
 */
export function humanizeChainError(err: unknown, endpoint?: string): string {
  const raw = readableError(err);
  const lowered = raw.toLowerCase();

  // @polkadot/api's WsProvider throws this exact string when the HTTP
  // upgrade handshake gets a non-101. Most common cause: user passed an
  // https:// / http:// URL, or the endpoint isn't a WS server at all.
  if (lowered.includes('non-101')) {
    return `${raw} — the endpoint responded but not with a WebSocket upgrade. Is "${endpoint ?? 'the URL'}" actually a ws:// or wss:// server?`;
  }

  // Node.js DNS failure. Common: user typo, VPN not connected.
  if (lowered.includes('enotfound') || lowered.includes('getaddrinfo')) {
    return `${raw} — DNS lookup failed for "${endpoint ?? 'the host'}". Check the URL spelling or network connection.`;
  }

  // TCP-level rejection — port closed, or nothing listening.
  if (lowered.includes('econnrefused')) {
    return `${raw} — nothing accepted the connection. Is your node running and reachable on this port?`;
  }

  // WS handshake timed out inside our own DEFAULT_CONNECT_TIMEOUT_MS
  // race. Suggest --timeout for cross-continent RPCs.
  if (lowered.includes('could not connect') && lowered.includes('within')) {
    return `${raw} — try --timeout <seconds> if this is a slow / cross-continent endpoint.`;
  }

  // TLS / cert issues on wss://.
  if (lowered.includes('cert') || lowered.includes('ssl')) {
    return `${raw} — TLS handshake failed. Confirm the wss:// endpoint's certificate is valid.`;
  }

  // OS-level network timeout — beats our own timer to the punch on
  // networks with aggressive TCP backoff. Distinct from
  // ConnectTimeoutError (application-layer race) above.
  if (lowered.includes('etimedout')) {
    return `${raw} — OS-level timeout / network layer timeout before our own race fired. Endpoint likely blackholed or firewalled.`;
  }

  // JSON-RPC standard error codes surfaced by public RPCs. -32000 is
  // the classic "rate limited / restricted" catch-all; -32603 is
  // internal-server; -32601 is method-not-found (chain doesn't
  // implement the RPC we asked for).
  if (raw.includes('-32000') || lowered.includes('rate limit') || lowered.includes('too many requests')) {
    return `${raw} — public RPC likely rate-limiting you. Try a different endpoint (kusama, ibp mirror) or your own node.`;
  }
  if (raw.includes('-32601') || lowered.includes('method not found')) {
    return `${raw} — the chain runtime doesn't expose this RPC. Confirm you're pointed at Portaldot / a Substrate chain that supports it.`;
  }
  if (raw.includes('-32603')) {
    return `${raw} — RPC internal error. Endpoint reachable but the runtime blew up on this call.`;
  }

  // Nonce clash (RPC 1014): two signing commands from the SAME account
  // submitted close together each read the same on-chain nonce, so the
  // second collides with the first still sitting in the pool. Every
  // signing command (send/seed/assets/fund/debug --demo) hits this the
  // same way, so the hint lives here once instead of in each caller.
  if (raw.includes('1014') || lowered.includes('priority is too low')) {
    return `${raw} — nonce clash: another transaction from the same account is still pending. Wait for it to land, or retry.`;
  }

  return raw;
}
