# `pdk-ts` basic consumer example

Minimal TypeScript project that imports `pdk-ts` as a library rather
than invoking the CLI. Two use cases:

1. **Programmatic FailLens decode** — parse a raw `Module { index,
   error }` code inside your app and surface the named error + fix
   steps to your users.
2. **Custom telemetry** — call `doctor` from a health-check endpoint
   in your dApp backend.

## Structure

```
basic-consumer/
├── package.json          → depends on `portaldot-pdk-ts` (when published)
├── src/
│   └── index.ts          → runs both flows and prints results
└── README.md
```

Once pdk-ts publishes to npm at 0.2.0 stable, this consumer will
resolve via `npm install portaldot-pdk-ts`. For the alpha, it links
against the in-repo `pdk-ts/` via a relative dependency.

## Run

```bash
cd docs/examples/basic-consumer
npm install
npm start
```

## Sample output

```
--- flow 1: programmatic explain ---
Balances.InsufficientBalance
  You tried to transfer more POT than the sending account holds.
  → Check the sender balance via the Portaldot explorer or `pdk doctor`.
  → Lower the transfer amount, or fund the account first.

--- flow 2: doctor health probe ---
Endpoint: wss://rpc.polkadot.io
Chain:    Polkadot
Runtime:  polkadot 2003000
Pallets:  61
```
