/**
 * Library entry point for `portaldot-pdk-ts`.
 *
 * The CLI ships from `dist/index.js` (see the `bin` field in
 * package.json). This file is the *library* entry: what `import
 * { ... } from 'portaldot-pdk-ts'` resolves to for programmatic
 * consumers (dApps, backends, notebooks).
 *
 * Everything re-exported here is intentional public surface. Adding
 * to this file is a semver-minor. Removing from it is a semver-major.
 * Internals live under `./commands` / `./core` and remain deep-import
 * only for advanced use.
 *
 * @example Offline FailLens lookup (no @polkadot/api loaded)
 * ```ts
 * import { resolveByName } from 'portaldot-pdk-ts';
 *
 * const fix = resolveByName('balances.InsufficientBalance');
 * console.log(fix?.summary);
 * for (const step of fix?.steps ?? []) console.log('→', step);
 * ```
 *
 * @example Health probe against a live node
 * ```ts
 * import { collectReport } from 'portaldot-pdk-ts';
 *
 * const report = await collectReport('wss://rpc.portaldot.io');
 * console.log(`chain=${report.chain} pallets=${report.palletCount}`);
 * ```
 *
 * @example Decode a raw Module { index, error } code by walking metadata
 * ```ts
 * import { resolve } from 'portaldot-pdk-ts';
 *
 * const decoded = await resolve('wss://rpc.portaldot.io', 6, 2);
 * console.log(`${decoded.palletName}.${decoded.errorName}`);
 * console.log(decoded.summary);
 * ```
 */

// FailLens core — decode a raw code or a name into a fix report.
export {
  resolve,
  resolveByName,
  type ExplainOptions,
  type ExplainReport,
} from './commands/explain.js';

// Health probe — programmatic version of `pdk-ts doctor`.
export {
  collectReport,
  type DoctorOptions,
  type DoctorReport,
} from './commands/doctor.js';

// Tool diagnostic — programmatic version of `pdk-ts diagnose`.
export {
  collect as diagnose,
  type DiagnoseOptions,
  type DiagnoseReport,
} from './commands/diagnose.js';

// Knowledge base + offline error index (read-only).
export {
  loadKb,
  loadIndex,
  lookup,
  indexLookup,
  indexSize,
  kbSize,
  kbPath,
  indexMatchesChain,
  indexDrift,
  indexMeta,
  INDEX_SPEC_NAME,
  INDEX_SPEC_VERSION,
  type KbEntry,
} from './core/kb.js';

// Error-shape helpers — humanize @polkadot/api WebSocket rejections
// into actionable one-liners.
export {readableError, humanizeChainError} from './core/errors.js';

// Chain connection — advanced use. Prefer `collectReport()` /
// `resolve()` for common tasks; `getApi()` is exposed for consumers
// who want their own `ApiPromise` handle.
export {getApi, closeApi} from './core/chain.js';

// Node URL resolution + validation.
export {DEFAULT_NODE, VERSION, resolveNode, validateNodeUrl} from './core/config.js';
