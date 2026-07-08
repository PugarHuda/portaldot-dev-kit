# pdk-ts α.4 — signing tier design

Status: **DESIGN** (not implemented). This document scopes the α.4
alpha which introduces the first commands that move POT: `simulate`,
`send`, `seed`. Everything before α.4 has been read-only by design.

## Goals

1. Match Python `pdk` behavior byte-for-byte on the CLI surface —
   same flags, same output shape.
2. Never surprise the user. No transaction is submitted without an
   explicit `--send` or `--yes` confirmation, or a `--demo` flag.
3. Sensible defaults for the common case (`pdk-ts send Bob 1` from
   the Alice dev URI just works on a local dev node).
4. Structured error taxonomy so `pdk-ts debug` (α.5) has clean input.

## Command shape

### `pdk-ts simulate --amount N [--from //Alice] [--to //Bob] [--json]`

- Read-only pre-flight. Predicts fee, feasibility, and post-transfer
  balances.
- Uses `api.tx.balances.transferKeepAlive(dest, value).paymentInfo(sender)`
  for fee estimation.
- No signing, no submission.

### `pdk-ts send <to> --amount N [--from //Alice] [--send] [--json]`

- Default: **dry-run**. Prints what would happen. Same output as
  `simulate` plus the compose call and estimated tip.
- `--send` flag actually submits, waits for inclusion, returns tx
  hash + block number.
- Refuses to submit if simulate predicts failure (unless
  `--force-send`).

### `pdk-ts seed [--file <yaml>] [--send] [--json]`

- Loads a YAML fixture (defaults to `pdk/data/seed.example.yaml`,
  shared with Python).
- Same dry-run / `--send` semantics as `send`.

## Signing pathway

- Keypair source resolves in this precedence:
  1. `--uri <//Alice>` explicit flag
  2. `PDK_TS_URI` env var
  3. `--mnemonic-file <path>` flag (reads file content, treats as
     mnemonic phrase)
  4. Default `//Alice` **only when `--dev` flag is passed** (safety
     against accidental mainnet Alice usage)

- No key material ever persists in memory beyond the tx submit call.
- No key material logs to stdout / stderr. `--json` output shows the
  SS58 address only, never a mnemonic or seed.

## Nonce handling

- Reuse Python's pattern: fetch nonce fresh per submit, retry once
  on `1010 Bad Nonce` with tip escalation (+10%).
- Second retry throws — no infinite loop.

## Failure mapping

- On `ExtrinsicFailed`, parse `DispatchError` → module/error →
  reuse `explain`'s resolver to attach a named error + KB fix.
- Print the standard FailLens block, then exit non-zero with the
  code below.

## Exit codes

| Code | Meaning |
|---|---|
| 0    | Success — tx included in a block |
| 1    | User error — bad flag, missing keypair, malformed amount |
| 2    | Chain rejected — `ExtrinsicFailed` with a named error |
| 3    | Chain unreachable / connect timeout |
| 4    | Simulate predicts failure and `--force-send` not passed |
| 5    | Network error mid-submit (retry safe) |

## Testing plan

- **Unit tests** — pure functions only: fee-estimation shape, argv
  parsing, nonce-retry math.
- **Integration tests** — CI spins up a local Substrate node
  (`@acala-network/chopsticks`) and exercises `simulate` + `send
  --send` + `seed --send`. Cannot run against public RPC because it
  requires actual POT.
- **Manual verification** — run against a local Portaldot node
  before tagging the α.4 release. Document the transcript in
  `docs/alpha4-manual-transcript.md`.

## Out of scope for α.4

- Multi-sig, proxy accounts, batched calls — deferred to a later
  alpha or beta.
- Custom pallet transactions beyond the runtime's public tx types.
- Hardware wallet integration (Ledger/Polkadot Vault) — post-1.0.

## Timeline estimate

Based on actual α.1–α.3 velocity (7 commands in 2 days) and given
that `send`/`seed` share most of the signing/submitting boilerplate
with `simulate`:

- Design → implementation: 1 day
- Integration test infrastructure (chopsticks in CI): 1 day
- Manual verification against Portaldot local node: 0.5 day
- α.4 tag + publish: same-day after all above

**Ship target: 2-3 days after design freeze.** Same-week if no
surprises with V13 metadata edge cases.

## Open questions

1. Should `pdk-ts send` accept a raw SS58 address for `<to>` or
   require `//URI` form for consistency with `--from`?
   → Both. Detect SS58 (starts with `5`, matches regex) vs URI.
2. Should the dry-run output include the SCALE-encoded call bytes?
   → Yes, behind `--verbose`. Useful for downstream tools.
3. How to handle the (rare) `ExtrinsicSuccess` with a non-zero
   `dispatch_info.class`?
   → Log a warning but exit 0. Not a failure.
