import {describe, it, expect} from 'vitest';
import {resolveNode, DEFAULT_NODE, VERSION} from '../src/core/config.js';

describe('config resolution', () => {
  it('returns DEFAULT_NODE when nothing is set', () => {
    delete process.env.PDK_TS_NODE;
    expect(resolveNode()).toBe(DEFAULT_NODE);
  });

  it('honours PDK_TS_NODE env var', () => {
    process.env.PDK_TS_NODE = 'ws://custom:9944';
    expect(resolveNode()).toBe('ws://custom:9944');
    delete process.env.PDK_TS_NODE;
  });

  it('CLI override wins over env', () => {
    process.env.PDK_TS_NODE = 'ws://env:9944';
    expect(resolveNode('ws://cli:9944')).toBe('ws://cli:9944');
    delete process.env.PDK_TS_NODE;
  });

  it('exposes a valid semver-shaped VERSION', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/);
  });
});
