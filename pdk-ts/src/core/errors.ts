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

  return raw;
}
