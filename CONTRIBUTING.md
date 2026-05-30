# Contributing to pdk

pdk aims to be **the standard developer toolkit for Portaldot**. The fastest way
to help is to grow the part that compounds for everyone: the error knowledge base.

## The knowledge base is community-owned

FailLens decodes a failure against the chain's metadata, then looks up a curated
fix in [`pdk/data/error_fixes.yaml`](pdk/data/error_fixes.yaml). Every entry you
add helps every Portaldot developer who hits that error next.

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
[`.github/workflows/release.yml`](.github/workflows/release.yml) using PyPI
**Trusted Publishing** (OIDC — no token in the repo).

One-time setup (maintainer): on PyPI, open the `portaldot-pdk` project →
*Publishing* → add a Trusted Publisher with
owner `PugarHuda`, repo `portaldot-hackathon-2026-pdk-AmpunBang`,
workflow `release.yml`, environment `pypi`.

To release:

```bash
# bump the version in pyproject.toml and pdk/__init__.py first, then:
git tag v0.1.0
git push origin v0.1.0
```

The workflow builds the sdist + wheel and publishes them.

### If release.yml fails after a repo rename

Trusted Publishers on PyPI are pinned to a specific GitHub owner + repo
name. When the repo is renamed (e.g. `portaldot-pdk` → `portaldot-hackathon-
2026-pdk-AmpunBang`), the OIDC token from GitHub no longer matches the
Trusted Publisher's repo field, and the release step fails with a 403 plus
a pointer to PyPI's [Trusted Publishers troubleshooting guide][tp].

To fix:

1. Open https://pypi.org/manage/project/portaldot-pdk/settings/publishing/.
2. Under "Trusted publisher management", delete the stale entry that
   references the old repo name.
3. Add a new Trusted Publisher with the *new* repo name (the rest
   stays the same: owner `PugarHuda`, workflow `release.yml`, environment
   `pypi`).
4. Re-run the failed release run from GitHub Actions, or push a new tag.

Until that's done, releases can be uploaded manually as a one-off:

```bash
python -m build                          # build sdist + wheel
python -m twine upload dist/*            # uses ~/.pypirc, or pass --username __token__ --password $TOKEN
```

[tp]: https://docs.pypi.org/trusted-publishers/troubleshooting/

## License

By contributing you agree your work is released under the project's MIT license.
