# Publishing pdk + pdk-ts

Release checklist for maintainers. Both packages ship separately, but
the tag-triggered workflows own the actual publish — this file only
covers what a human has to do.

## One-time setup

### GitHub repo Secrets
Settings → Secrets and variables → Actions → New repository secret:

- **`NPM_TOKEN`** — automation token from
  [npmjs.com/settings/pugarhuda/tokens](https://www.npmjs.com/settings/PugarHuda/tokens)
  (scope: **Automation**, allow publish + read). Required by
  `.github/workflows/pdk-ts-publish.yml`.
- **`PYPI_API_TOKEN`** — API token from pypi.org (scope: pdk project).
  Required by `.github/workflows/release.yml`.

### GHCR Docker image visibility
GHCR default is **private**. Flip to public **once** after the first
tag build:

1. Go to https://github.com/users/PugarHuda/packages/container/portaldot-pdk-ts
2. Package settings → Change visibility → Public → confirm

(There is no REST API endpoint for user-owned package visibility as of
this writing — has to be UI.)

### Vercel auto-deploy
The homepage at [portaldot-pdk.vercel.app](https://portaldot-pdk.vercel.app)
should redeploy on every master push. Verify with `vercel git connect`
after any repo rename. If a deploy staled, force one from the Vercel
dashboard or push a trivial commit.

## Cutting a release

### Python `pdk` (PyPI)

```bash
# 1. Bump pyproject.toml `version = "X.Y.Z"`
# 2. Add a `## [X.Y.Z] — YYYY-MM-DD` entry to CHANGELOG.md
# 3. Commit + push
git commit -am "pdk: X.Y.Z" && git push

# 4. Tag + push tag → triggers .github/workflows/release.yml
git tag vX.Y.Z -m "pdk vX.Y.Z"
git push origin vX.Y.Z

# 5. Optional: publish GitHub Release with the changelog body
gh release create vX.Y.Z --title "pdk vX.Y.Z" --notes-file <notes>

# 6. Verify PyPI:
curl -s https://pypi.org/pypi/portaldot-pdk/json | python -c "import json,sys; print(json.load(sys.stdin)['info']['version'])"
```

### TypeScript `pdk-ts` (npm + GHCR)

```bash
# 1. Bump pdk-ts/package.json + pdk-ts/src/core/config.ts VERSION
# 2. Add a `## X.Y.Z-alpha.N — YYYY-MM-DD` entry to pdk-ts/CHANGELOG.md
# 3. Commit + push
git commit -am "pdk-ts X.Y.Z-alpha.N" && git push

# 4. Tag → triggers 3 workflows:
#      - pdk-ts CI (matrix build + integration smoke)
#      - Docker (multi-arch build + push to GHCR)
#      - pdk-ts publish (npm publish --provenance --tag alpha)
git tag pdk-ts-vX.Y.Z-alpha.N -m "pdk-ts X.Y.Z-alpha.N"
git push origin pdk-ts-vX.Y.Z-alpha.N

# 5. Draft release notes at pdk-ts/docs/releases/vX.Y.Z-alpha.N.md then:
gh release create pdk-ts-vX.Y.Z-alpha.N \
  --title "pdk-ts vX.Y.Z-alpha.N — <summary>" \
  --notes-file pdk-ts/docs/releases/vX.Y.Z-alpha.N.md \
  --prerelease   # drop --prerelease for stable X.Y.Z

# 6. Verify npm:
npm view portaldot-pdk-ts@alpha version

# 7. Verify GHCR:
docker pull ghcr.io/pugarhuda/portaldot-pdk-ts:X.Y.Z-alpha.N
```

### Dist-tag semantics (npm)

- `alpha` → `X.Y.Z-alpha.N` prereleases. `npm install portaldot-pdk-ts@alpha`.
- `latest` → stable `X.Y.Z`. Bare `npm install portaldot-pdk-ts`.

The publish workflow derives the tag from the version string; no
manual override needed.

## When something fails

### `pdk-ts publish` — `NODE_AUTH_TOKEN: ""`
Empty token = missing `NPM_TOKEN` secret. See "One-time setup" above.
Re-run: `gh workflow run pdk-ts-publish.yml --ref pdk-ts-vX.Y.Z-alpha.N`.

### `pdk-ts CI` — integration smoke against RPC times out
Public RPC (Polkadot / Kusama / IBP) rate-limited. Re-run:
`gh run rerun <run-id>` — the workflow has three-endpoint fallback.

### GHCR image 401 Unauthorized
Visibility didn't flip. See "One-time setup".

### PyPI publish blocked by "file already exists"
`release.yml` sets `skip-existing: true`, so this is normally silent.
If it fails hard, someone else registered the version — bump patch and
retry.

## Verifying release from a fresh box

```bash
# Python
docker run --rm python:3.12 sh -c \
  "pip install portaldot-pdk && pdk explain --module 6 --error 2"

# TypeScript
docker run --rm node:22 sh -c \
  "npm install -g portaldot-pdk-ts@alpha && pdk-ts explain --name balances.InsufficientBalance"

# Docker image direct
docker run --rm ghcr.io/pugarhuda/portaldot-pdk-ts:latest --help
```

If any of those fail, work backwards from the CI logs of the tag push.
