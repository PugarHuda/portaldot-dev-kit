/**
 * `humanizeChainError` locks the mapping from raw @polkadot/api /
 * Node.js network error shapes to actionable one-liners. Regressions
 * here directly hurt debugging UX — worth locking.
 */

import {describe, it, expect} from 'vitest';
import {humanizeChainError, readableError} from '../src/core/errors.js';

describe('readableError', () => {
  it('extracts message from a plain Error', () => {
    expect(readableError(new Error('boom'))).toBe('boom');
  });

  it('extracts message from an object with .message', () => {
    expect(readableError({message: 'from object'})).toBe('from object');
  });

  it('extracts nested .error.message', () => {
    expect(readableError({error: {message: 'nested'}})).toBe('nested');
  });

  it('falls back to .type as "network event:"', () => {
    expect(readableError({type: 'error'})).toBe('network event: error');
  });

  it('falls back to .code when nothing else matches', () => {
    expect(readableError({code: 'ECONNRESET'})).toBe('ECONNRESET');
  });

  it('handles primitive strings', () => {
    expect(readableError('raw string')).toBe('raw string');
  });

  it('handles null/undefined without throwing', () => {
    expect(() => readableError(null)).not.toThrow();
    expect(() => readableError(undefined)).not.toThrow();
  });
});

describe('humanizeChainError', () => {
  it('maps non-101 → "not a WebSocket server"', () => {
    const raw = 'Received network error or non-101 status code.';
    const out = humanizeChainError(new Error(raw), 'wss://foo.example');
    expect(out).toContain(raw);
    expect(out).toMatch(/not with a WebSocket upgrade|actually a ws:\/\//i);
    expect(out).toContain('wss://foo.example');
  });

  it('maps ENOTFOUND → "DNS lookup failed"', () => {
    const raw = 'getaddrinfo ENOTFOUND bad.host';
    const out = humanizeChainError(new Error(raw), 'wss://bad.host');
    expect(out).toContain(raw);
    expect(out).toMatch(/DNS lookup failed/i);
  });

  it('maps ECONNREFUSED → "nothing accepted the connection"', () => {
    const out = humanizeChainError(new Error('connect ECONNREFUSED 127.0.0.1:9944'));
    expect(out).toMatch(/nothing accepted the connection/i);
  });

  it('maps our own ConnectTimeoutError → "try --timeout"', () => {
    const raw = 'could not connect to wss://slow.example within 10000ms';
    const out = humanizeChainError(new Error(raw));
    expect(out).toContain(raw);
    expect(out).toMatch(/--timeout/);
  });

  it('maps TLS/SSL errors → "TLS handshake failed"', () => {
    const out = humanizeChainError(new Error('unable to verify the first certificate'));
    expect(out).toMatch(/TLS handshake failed/i);
  });

  it('maps ETIMEDOUT (OS network timeout) → "network timeout"', () => {
    const out = humanizeChainError(new Error('connect ETIMEDOUT'));
    expect(out).toMatch(/network layer timeout|OS-level timeout/i);
  });

  it('passes through unknown shapes unchanged (never hides real info)', () => {
    const raw = 'some totally novel error nobody has seen';
    const out = humanizeChainError(new Error(raw));
    expect(out).toBe(raw);
  });

  it('works with the same non-Error shapes readableError accepts', () => {
    const out = humanizeChainError({message: 'non-101 status code', type: 'error'}, 'wss://x');
    expect(out).toMatch(/not with a WebSocket upgrade/i);
  });

  it('maps JSON-RPC -32000 → "rate-limiting" hint', () => {
    const out = humanizeChainError(new Error('rpc error -32000: too many requests'));
    expect(out).toMatch(/rate-limit/i);
  });

  it('maps "rate limit" plain text → same hint', () => {
    const out = humanizeChainError(new Error('rate limit exceeded'));
    expect(out).toMatch(/rate-limit/i);
  });

  it('maps JSON-RPC -32601 → "method not exposed"', () => {
    const out = humanizeChainError(new Error('rpc error -32601 method not found'));
    expect(out).toMatch(/doesn't expose this RPC|Substrate chain that supports/i);
  });

  it('maps JSON-RPC -32603 → "internal error"', () => {
    const out = humanizeChainError(new Error('rpc error -32603 internal server error'));
    expect(out).toMatch(/internal error|runtime blew up/i);
  });
});
