# Contributing to PDK

PDK ships as two CLIs — `pdk` (Python) and `pdk-ts` (TypeScript
companion) — in one repository. Both read the same shared knowledge
base. This file covers the Python side and cross-cutting concerns;
TypeScript-specific rules live at [`pdk-ts/CONTRIBUTING.md`](pdk-ts/CONTRIBUTING.md).

Quick jump:
- Adding a new fix to the shared KB → below
- Working on `pdk` (Python) → below
- Working on `pdk-ts` (TypeScript) → [`pdk-ts/CONTRIBUTING.md`](pdk-ts/CONTRIBUTING.md)
- Security disclosure → [`SECURITY.md`](SECURITY.md)
- Code of conduct → [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)

PDK aims to be **the standard developer toolkit for Portaldot**. The fastest way
to help is to grow the part that compounds for everyone: the error knowledge base.

## The knowledge base is community-owned

FailLens decodes a failure against the chain's metadata, then looks up a curated
fix in [`pdk/data/error_fixes.yaml`](pdk/data/error_fixes.yaml). Every entry you
add helps every Portaldot developer who hits that error next.

**Where to start:** run `pdk kb --missing` (Python) or `pdk-ts kb --missing`
(TypeScript) — both read the same shared KB and show the same shortlist — to
see the 175 indexed errors that don't yet have a curated fix. Each one is a
5-line YAML PR. Pick any pallet you know — Assets, Contracts, Staking,
Identity — and open a small PR with 3-5 entries.

Add an entry like this:

```yaml
"Balances.InsufficientBalance":
  summary: You tried to transfer more POT than the sending account holds.
  steps:
    - Check the sender balance with `pdk accounts` or the explorer.
    - Lower the amount, or fund the account first.
```

Rules:

- The key is `"<Pallet>.<ErrorName>"`, **exactly as it appears in the runtime
  metadata**. Verify it: `pdk pallets` lists every pallet, call, and error name.
- `summary` is one plain-language sentence — what happened, no jargon.
- `steps` are concrete, ordered actions a developer can take right now.
- Unknown errors still work (FailLens falls back to the metadata doc comment),
  so you only need to add entries that deserve a better, hand-written fix.

## Development

```bash
git clone https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang pdk
cd pdk
pip install -e .
PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest tests/ -q
```

Run the live commands against a local node (`pdk up`, inside WSL on Windows).
Keep command modules in `pdk/commands/` thin; chain logic lives in `pdk/core/`.

## Cutting a release

Releases publish to PyPI automatically via
[`.github/workflows/release.yml`](.github/workflows/release.yml) on any
`v*` tag push, and can also be re-triggered manually with
`gh workflow run release.yml`.

Auth uses a PyPI API token stored as the `PYPI_API_TOKEN` GitHub Actions
secret. Token-based auth was chosen over Trusted Publishing (OIDC) after
the repo was renamed mid-hackathon: Trusted Publisher records pin to a
specific owner + repo pair, and every rename forces a manual reconfig on
pypi.org that web-only auth (with 2FA) makes hard to automate. Tokens
survive renames; rotate periodically.

To rotate the token:

1. Open https://pypi.org/manage/account/token/ → create a project-scoped
   token for `portaldot-pdk`.
2. `gh secret set PYPI_API_TOKEN -b <new-token>` (or paste in the GitHub
   Settings → Secrets UI).
3. Revoke the old token on PyPI.

To release:

```bash
# bump the version in pyproject.toml and pdk/__init__.py first, then:
git tag v0.1.0
git push origin v0.1.0
```

The workflow builds the sdist + wheel and publishes them.

### Manually trigger a release without a new tag

`release.yml` supports `workflow_dispatch`, so a maintainer can re-run the
publish step without pushing a new tag (useful if PyPI rate-limited the
last attempt or a network blip killed the upload mid-stream):

```bash
gh workflow run release.yml
```

The publish step is configured with `skip-existing: true`, so re-running
against a version that's already on PyPI is a no-op rather than a fatal
"file already exists" error.

### Falling back to a fully-manual upload

If everything CI-side is hosed, the release also works straight from a
developer machine:

```bash
python -m build                                          # build sdist + wheel
python -m twine upload --username __token__ \
                       --password "$PYPI_API_TOKEN" \
                       dist/*
```

## License

By contributing you agree your work is released under the project's MIT license.
