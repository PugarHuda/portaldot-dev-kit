# Using pdk in CI

`pdk` is not only an interactive CLI — it is built to gate a pipeline. The
`pdk debug --json --exit-code` contract lets a Portaldot project's CI **fail the
build with a human-readable diagnosis** when an on-chain integration test
submits a transaction that fails.

## The contract

```bash
pdk debug <txhash> --json --exit-code
```

- Exit `0` — the transaction succeeded (or wasn't a failure).
- Exit `2` — a failure was decoded. The JSON line carries the pallet, error
  name, plain-language summary, and ordered fix steps.
- Exit `1` — operational error (no node reachable, hash not found in range).

## Reference GitHub Actions workflow

> A template for a **Portaldot project** that runs on-chain integration tests.
> It boots a local node on the Ubuntu runner (the node binary ships for Linux/macOS),
> exercises the chain, then gates on any decoded failure. Adapt the node
> download URL and your own integration step.

```yaml
name: onchain-integration
on: [push, pull_request]

jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }

      # 1. Install pdk
      - run: pip install portaldot-pdk

      # 2. Boot a local Portaldot node in the background
      - name: Start Portaldot node
        run: |
          wget -q https://github.com/portaldotVolunteer/Portaldot-node/raw/main/portaldot-testnet-ubuntu.tar.gz
          tar -xzf portaldot-testnet-ubuntu.tar.gz
          chmod +x portaldot-testnet-ubuntu/portaldot_dev
          ./portaldot-testnet-ubuntu/portaldot_dev --dev --alice --ws-external --rpc-cors all &
          # wait for the chain to produce blocks
          for i in $(seq 1 30); do pdk doctor && break || sleep 2; done

      # 3. Run your project's transactions, capture the tx hash you want to assert on
      - name: Run integration transaction
        id: tx
        run: echo "hash=0x<your-tx-hash>" >> "$GITHUB_OUTPUT"

      # 4. Gate the build on the result — a decoded failure exits non-zero
      - name: Assert transaction succeeded
        run: pdk debug "${{ steps.tx.outputs.hash }}" --json --exit-code
```

If the transaction failed, the step exits `2` and the log shows exactly which
error and how to fix it — instead of a raw `Module error: 0x0600…`.

## Local pre-commit / Makefile use

```bash
# fail a local check script when a smoke-test tx regresses
pdk debug "$TX" --json --exit-code || {
  echo "On-chain smoke test regressed — see diagnosis above"; exit 1;
}
```
