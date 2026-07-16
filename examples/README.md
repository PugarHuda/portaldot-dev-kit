# pdk-ts examples

Runnable examples consumers can copy as-is.

| Example | What it shows |
| --- | --- |
| [`basic-consumer/`](basic-consumer) | Minimal TypeScript project that imports `pdk-ts` as a library. Two flows: offline FailLens lookup (`resolveByName`) + live health probe (`collectReport`). Includes `flow1-only.ts` for network-free demos. |

Each example is a self-contained npm project. They wire the local
in-repo `pdk-ts/` via a `file:` dependency, so any change to pdk-ts
sources is visible after `npm run build` in `pdk-ts/`.

## Adding an example

1. Create a directory here with `package.json` (`private: true`),
   `tsconfig.json`, and `src/`.
2. Depend on the local pdk-ts with `"portaldot-pdk-ts": "file:../../pdk-ts"`.
3. Add a short `README.md` explaining what the example demonstrates.
4. Wire a typecheck job in `.github/workflows/pdk-ts.yml` under the
   existing `consumer-example` pattern.
