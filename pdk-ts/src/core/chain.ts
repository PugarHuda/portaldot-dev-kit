/**
 * Chain connection helper. Lazily creates a single `ApiPromise` per process
 * — commands call `getApi(node)` and receive the same instance across the
 * lifetime of the CLI invocation. Disconnect is explicit via `closeApi()`.
 *
 * We prefer `@polkadot/api` over PAPI for the v0.2 alpha because
 * Portaldot's V13 metadata + custom-pallet coverage is more mature on
 * polkadot.js today. PAPI migration is scoped for v0.2.0-alpha.5+.
 *
 * Library-friendliness: `@polkadot/api` is a heavy graph (~4 MB) and
 * this module is on the public import path via `lib.ts`. We DO NOT
 * pull it at module-load time — the dynamic `import('@polkadot/api')`
 * inside `getApi()` means offline-only consumers (`resolveByName`,
 * `loadKb`, etc.) never pay for it. Cold `import('portaldot-pdk-ts')`
 * drops from ~2.8 s to ~50 ms as a result.
 */

// Type-only imports — erased at runtime, cost nothing.
import type {ApiPromise, WsProvider} from '@polkadot/api';

// Install stdout-noise filtering only from the CLI entry (`bin/index.ts`
// sets `PDK_TS_CLI=1` before parsing argv). Library consumers get their
// own `console.log`/`.info`/`.warn` untouched.
let consoleFilterInstalled = false;
export function installConsoleFilter(): void {
  // Idempotent. Module-level flag instead of a process.env write so we
  // don't leak PDK_TS_CONSOLE_FILTER_INSTALLED into every child process
  // the CLI ever spawns.
  if (consoleFilterInstalled || process.env.DEBUG_POLKADOT_API) return;
  consoleFilterInstalled = true;
  const noise = /(RPC-CORE|API\/INIT|REGISTRY:)/;
  const filter = (fn: typeof console.log) => {
    return ((...args: unknown[]) => {
      for (const a of args) {
        if (typeof a === 'string' && noise.test(a)) return;
      }
      fn(...args);
    }) as typeof console.log;
  };
  console.info = filter(console.info);
  console.log = filter(console.log);
  console.warn = filter(console.warn);
}

let cached: {node: string; api: ApiPromise} | null = null;

// Prevents `getApi()` from creating two in-flight connections when two
// async paths race — the second caller waits on the first's promise.
let pendingConnect: Promise<ApiPromise> | null = null;

// SIGINT/SIGTERM safety: ensure any live provider is torn down before
// the process actually exits, so users don't leak WebSocket sockets
// when they Ctrl+C a slow doctor call.
let signalHooksInstalled = false;
function installSignalHooks(): void {
  if (signalHooksInstalled) return;
  signalHooksInstalled = true;
  const cleanupAndExit = (code: number) => {
    void closeApi().finally(() => process.exit(code));
  };
  process.once('SIGINT', () => cleanupAndExit(130));
  process.once('SIGTERM', () => cleanupAndExit(143));
}

// 10 s default — a healthy WebSocket handshake completes in <1 s even
// cross-continent, so 10 s is generous but not painful when the node
// is actually down. Override per-command with `--timeout <seconds>`.
const DEFAULT_CONNECT_TIMEOUT_MS = 10_000;

class ConnectTimeoutError extends Error {
  constructor(node: string, ms: number) {
    super(`could not connect to ${node} within ${ms}ms`);
    this.name = 'ConnectTimeoutError';
  }
}

/**
 * Race the API creation against a hard timeout. Without this, an
 * unreachable endpoint would leave `ApiPromise.create` waiting on a
 * `WsProvider` that silently retries forever — the CLI would hang and
 * eventually be killed by the shell with no error output.
 */
export async function getApi(
  node: string,
  timeoutMs: number = DEFAULT_CONNECT_TIMEOUT_MS,
): Promise<ApiPromise> {
  installSignalHooks();
  if (cached && cached.node === node) return cached.api;
  if (pendingConnect) return pendingConnect;
  if (cached && cached.node !== node) {
    await cached.api.disconnect();
    cached = null;
  }

  // Lazy — @polkadot/api's ~4 MB module graph loads only on first
  // actual connect. Offline consumers of the library never touch this.
  const {ApiPromise: ApiCtor, WsProvider: WsCtor} = await import('@polkadot/api');

  // autoConnectMs > 0 lets WsProvider retry inside the timeout window;
  // if the endpoint is real but momentarily slow we still get through.
  const provider: WsProvider = new WsCtor(node, 1_000);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ConnectTimeoutError(node, timeoutMs)), timeoutMs);
  });

  pendingConnect = (async () => {
    try {
      const api = await Promise.race([
        ApiCtor.create({provider, throwOnConnect: true}),
        timeout,
      ]);
      if (timer) clearTimeout(timer);
      cached = {node, api};
      return api;
    } catch (err) {
      if (timer) clearTimeout(timer);
      try {
        await provider.disconnect();
      } catch {
        /* ignore */
      }
      throw err;
    } finally {
      pendingConnect = null;
    }
  })();
  return pendingConnect;
}

export async function closeApi(): Promise<void> {
  if (cached) {
    await cached.api.disconnect();
    cached = null;
  }
}
