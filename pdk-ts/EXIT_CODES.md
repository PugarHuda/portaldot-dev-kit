# pdk-ts exit codes

Scripts wrapping pdk-ts should treat these as a stable contract.

| Code | Meaning                                                              |
|-----:|:---------------------------------------------------------------------|
|   0  | Command succeeded. For probes (`doctor`/`diagnose`): endpoint healthy.|
|   1  | Command failed at the tool level: bad input, unresolvable name, connection failed, unreachable node. Message printed to stderr; `--json` still emits a machine-readable body on stdout when the failure is domain-level (e.g. `explain` couldn't resolve a name). |
|   2  | Reserved for commander's own argument-parsing failures (unknown flag, missing required option). Not raised by our handlers directly. |
| 130  | Interrupted by `SIGINT` (Ctrl+C). WebSocket cleanly closed first.    |
| 143  | Interrupted by `SIGTERM`. WebSocket cleanly closed first.            |

## Notes

- `pdk-ts explain` prefers to return `exit 0` with `resolved: null` in JSON
  mode when the metadata walk cannot map a `module.error` — that's a
  domain result, not a tool failure. It only returns `exit 1` when the
  input is invalid or the node can't be reached.
- `pdk-ts doctor` returns exit 1 when the endpoint is unreachable, when
  it responded but reported no pallets, or when the liveness check
  (default on) finds the chain hasn't advanced a block in ~7s — a
  reachable-but-stalled dev chain (e.g. a BABE epoch-change wedge) is a
  broken environment too. Pass `--no-liveness` to skip that check and
  probe reachability only. `pdk-ts diagnose --skip-connect` always
  returns 0 unless the tool itself failed to load its KB or index.
- All commands close the `ApiPromise` before exit. Ctrl+C on a
  mid-connect command triggers the same cleanup path.
