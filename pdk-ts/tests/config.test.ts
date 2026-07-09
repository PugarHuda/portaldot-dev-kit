/**
 * `validateNodeUrl` locks the "bad URL, fail fast" contract that
 * prevents a cryptic `[object ErrorEvent]` when `WsProvider` gets
 * something it can't work with.
 */

import {describe, it, expect} from 'vitest';
import {validateNodeUrl, resolveNode, DEFAULT_NODE} from '../src/core/config.js';

describe('validateNodeUrl', () => {
  it('accepts canonical lowercase ws:// and wss://', () => {
    expect(() => validateNodeUrl('ws://127.0.0.1:9944')).not.toThrow();
    expect(() => validateNodeUrl('wss://rpc.polkadot.io')).not.toThrow();
  });

  it('accepts uppercase / mixed-case schemes (URLs are scheme-insensitive)', () => {
    expect(() => validateNodeUrl('WSS://rpc.example.com')).not.toThrow();
    expect(() => validateNodeUrl('Ws://localhost:9944')).not.toThrow();
  });

  it('accepts IPv6 hosts inside brackets', () => {
    expect(() => validateNodeUrl('ws://[::1]:9944')).not.toThrow();
    expect(() => validateNodeUrl('wss://[2001:db8::1]:443')).not.toThrow();
  });

  it('accepts URLs with a path or query string', () => {
    expect(() => validateNodeUrl('wss://rpc.ibp.network/polkadot')).not.toThrow();
    expect(() => validateNodeUrl('ws://127.0.0.1:9944/?peer=1')).not.toThrow();
  });

  it('rejects http:// and https:// with a scheme-specific message', () => {
    expect(() => validateNodeUrl('http://rpc.example.com')).toThrowError(/http:\/\//);
    expect(() => validateNodeUrl('https://rpc.example.com')).toThrowError(/https:\/\//);
  });

  it('rejects schemes that are not ws/wss (like tcp://, file://)', () => {
    expect(() => validateNodeUrl('tcp://rpc.example.com:9944')).toThrow();
    expect(() => validateNodeUrl('file:///tmp/node')).toThrow();
  });

  it('rejects strings with no scheme at all', () => {
    expect(() => validateNodeUrl('rpc.example.com:9944')).toThrow();
    expect(() => validateNodeUrl('127.0.0.1:9944')).toThrow();
    expect(() => validateNodeUrl('//Alice')).toThrow();
  });

  it('rejects empty string / whitespace', () => {
    expect(() => validateNodeUrl('')).toThrow();
    expect(() => validateNodeUrl('   ')).toThrow();
  });
});

describe('resolveNode', () => {
  it('CLI override wins over env and default', () => {
    const prev = process.env.PDK_TS_NODE;
    process.env.PDK_TS_NODE = 'wss://env.example.com';
    try {
      expect(resolveNode('ws://cli.example.com:9944')).toBe('ws://cli.example.com:9944');
    } finally {
      if (prev === undefined) delete process.env.PDK_TS_NODE;
      else process.env.PDK_TS_NODE = prev;
    }
  });

  it('env override wins when no CLI override given', () => {
    const prev = process.env.PDK_TS_NODE;
    process.env.PDK_TS_NODE = 'wss://env.example.com';
    try {
      expect(resolveNode()).toBe('wss://env.example.com');
    } finally {
      if (prev === undefined) delete process.env.PDK_TS_NODE;
      else process.env.PDK_TS_NODE = prev;
    }
  });

  it('falls back to DEFAULT_NODE when neither is set', () => {
    const prev = process.env.PDK_TS_NODE;
    delete process.env.PDK_TS_NODE;
    try {
      expect(resolveNode()).toBe(DEFAULT_NODE);
    } finally {
      if (prev !== undefined) process.env.PDK_TS_NODE = prev;
    }
  });
});
