# pdk — Troubleshooting

Every failure mode anticipated, with the exact command to fix it. Organised
by where in the workflow you hit it.

If you encounter something not listed here, please open an issue with the
command you ran and the **full output** (including the prompt line) so the
list can keep growing.

---

## 1. Install / setup

### `pip install` says "Requirement already satisfied: portaldot-pdk 0.1.0"

pip cached an old wheel. Force-fetch the latest:

```bash
pip install --upgrade --force-reinstall portaldot-pdk
```

If you still get an old version, you may have multiple Python installs.
Check which one pip actually uses:

```bash
python -m pip --version       # prints which python this pip belongs to
pip --version                 # may be different — confusing!
```

Use `python -m pip` (explicit) to be unambiguous.

### `'pdk' is not recognized as an internal or external command` (Windows)

You installed pdk but `pdk` isn't on PATH. Three options:

- **Module form** (no PATH change): `python -m pdk.cli --version`
- **Add Scripts to PATH** (one-time, then close+reopen cmd):

  ```cmd
  setx PATH "%PATH%;C:\Users\<YOU>\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts"
  ```

  Find your exact Scripts dir with:

  ```cmd
  python -c "import sysconfig; print(sysconfig.get_path('scripts'))"
  ```

- **Use a venv** (cleanest):

  ```cmd
  python -m venv .venv
  .venv\Scripts\activate
  pip install portaldot-pdk
  pdk --version
  ```

### `error: externally-managed-environment` (Debian/Ubuntu 24.04+)

PEP 668 blocks system-wide `pip install` on newer distros. Use a venv:

```bash
python3 -m venv ~/.venvs/pdk
source ~/.venvs/pdk/bin/activate
pip install portaldot-pdk
```

Or — if you know what you're doing — `pip install --user --break-system-packages`.

### `Python 3.11+ required` (and you have 3.10 or earlier)

pdk uses modern typing syntax. Upgrade Python, or run via Docker:

```bash
docker run -it --rm -v $(pwd):/work python:3.12-slim bash -c "pip install portaldot-pdk && pdk --version"
```

### `ModuleNotFoundError: No module named 'pdk'` after install

The pip ran against a different Python than your shell uses. Diagnose:

```bash
which python              # POSIX: the python in PATH
python -m pip show portaldot-pdk    # asks THIS python where the install went
```

Match `Location` to your `sys.path`. Easiest fix: venv.

### `eth-ape: collected ... pytest plugin error`

A third-party pytest plugin in your global env crashes pdk's tests. The
project's CONTRIBUTING.md tells you to set `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`:

```bash
PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest tests/ -q
```

---

## 2. Node / chain connectivity

### `Cannot reach a Portaldot node at ws://127.0.0.1:9944`

The node binary isn't running, or it's running somewhere pdk can't reach.

```bash
# Linux/macOS/WSL: start the node
./portaldot_dev --dev --base-path /tmp/portaldot-dev
# look for "Imported #N" lines scrolling past = it's working
```

### WSL2 — node runs but Windows-side pdk can't connect

Almost always WSL's localhost forwarding works, but if not:

```bash
wsl hostname -I              # e.g. 172.21.144.5
pdk doctor --node ws://172.21.144.5:9944
```

Or point pdk at any reachable Portaldot RPC: `--node ws://<host>:9944`.

### Port 9944 already in use

```bash
# Find what's holding it
ss -tulpn | grep 9944        # Linux
netstat -ano | findstr 9944  # Windows

# Kill the old process, or run node on a different port
./portaldot_dev --dev --base-path /tmp/portaldot-dev --rpc-port 9955
pdk doctor --node ws://127.0.0.1:9955
```

### Permission denied running `portaldot_dev`

```bash
chmod +x portaldot_dev
./portaldot_dev --version
```

### Dev chain stalled — `BABE: Unexpected epoch change`

A `--dev` DB can wedge. Reset:

```bash
pkill -f portaldot_dev
./portaldot_dev purge-chain --dev -y
./portaldot_dev --dev --base-path /tmp/portaldot-dev
```

`pdk doctor` (without `--no-liveness`) detects this for you and prints the
recovery command.

### `SubstrateRequestException` / connection timeout mid-call

Usually the WS connection dropped (laptop slept, network blip). Just retry
the command. If it persists, restart the node.

### `pdk debug --demo` fails first time on a cold node

The substrate-interface library lazy-loads runtime metadata on the first
RPC call — that one cold-start can take 5-10 seconds. Subsequent commands
are fast. If it times out, retry once.

---

## 3. Real transactions / POT

### `Send failed: Inability to pay some fees (e.g. account balance too low)`

The fee estimator is conservative. Two common causes:

- **You've been running demos.** Each `pdk debug --demo` warm-up burns a
  small POT fee. After many warm-ups Alice's balance is just under 50000
  POT. Use a smaller amount, or reset:

  ```bash
  pkill -f portaldot_dev
  ./portaldot_dev purge-chain --dev -y
  ./portaldot_dev --dev --base-path /tmp/portaldot-dev
  ```

- **Account hit the existential deposit floor.** If the recipient's
  resulting balance would drop below the ED, the transfer is rejected.
  Use a larger amount, or send to a different account.

### `1010 Invalid Transaction` on repeated submits

Nonce collision. `pdk` retries with a tip; if it still fails, wait one
block (~6s) and retry. Or restart the node for a clean slate.

### `pdk send` succeeds but doesn't appear in `pdk accounts` immediately

`accounts` is a snapshot at the time of the call. Run it again — block
finalisation takes a few seconds.

---

## 4. AI features

### AI section never appears, even with `PDK_AI_KEY` set

1. Confirm the env var is set **in the same shell**:

   ```bash
   echo $PDK_AI_KEY              # POSIX
   echo %PDK_AI_KEY%             # Windows cmd
   echo $env:PDK_AI_KEY          # PowerShell
   ```

2. Round-trip a request:

   ```bash
   pdk ai-setup --test
   ```

   Tells you whether OpenRouter accepts the key and the configured model
   responds.

3. Check no `--no-ai` snuck in via your shell history or a wrapper.

### `pdk ai-setup --test` hangs

The OpenRouter free model has cold-start latency. Default timeout is 45s.
If you're consistently getting >45s, the model is overloaded — swap:

```bash
export PDK_AI_MODEL=z-ai/glm-4.5-air:free
pdk ai-setup --test
```

### AI returns `<no content>` or empty

That model isn't responding to the prompt format. Switch to a known-working
one (`openai/gpt-oss-120b:free` is the verified default).

### Network blocks `openrouter.ai`

Use any OpenAI-compatible endpoint via `PDK_AI_BASE_URL`:

```bash
export PDK_AI_BASE_URL=https://api.groq.com/openai/v1/chat/completions
export PDK_AI_KEY=gsk_...        # Groq key
export PDK_AI_MODEL=llama-3.1-70b-versatile
```

### `UnicodeEncodeError: 'latin-1' codec` from urllib (older versions)

Fixed in v0.1.4+. Upgrade:

```bash
pip install --upgrade portaldot-pdk
```

---

## 5. Output / terminal

### `UnicodeEncodeError` when running on Windows cp1252

Fixed in v0.1.1+. pdk forces UTF-8 stdout at startup. Upgrade:

```bash
pip install --upgrade portaldot-pdk
```

### Rich output looks broken when piped (e.g. `| head`)

Rich detects no TTY and downgrades to plain text. That's intentional. If
you want the colours preserved, force them:

```bash
FORCE_COLOR=1 pdk explain | head -20
```

### `--json` output mixed with Rich box-drawing in `pdk debug --json`

This is a bug — please open an issue with the exact command. `--json`
should suppress all Rich panels.

### Help text wraps `--exit-code` in the middle on a narrow terminal

Cosmetic. The flag still works. Make your terminal wider, or:

```bash
COLUMNS=200 pdk debug --help
```

---

## 6. CI / `--exit-code` gating

### `pdk debug --json --exit-code` returns 0 on a known failure

Make sure both flags are present. `--exit-code` is OFF by default so
casual users don't get surprising non-zero exits.

### Exit code is 1 instead of 2

Exit 1 = pdk itself crashed or couldn't connect to the node. Exit 2 = the
transaction was decoded as a failure. Check stderr for the real reason.

---

## 7. Release pipeline

### `release.yml` fails with 403 after a repo rename

PyPI Trusted Publishers pin to a specific owner/repo pair. After a rename,
the OIDC token doesn't match. **pdk's `release.yml` already switched to
API token auth** to avoid this — if you forked and re-enabled OIDC, see
[CONTRIBUTING.md](../CONTRIBUTING.md) for the fix path.

### `release.yml` runs but PyPI upload fails with "File already exists"

You're trying to re-publish a version that's already on PyPI. PyPI never
allows overwriting. Either bump the version, or rely on
`skip-existing: true` (already in our workflow) which makes re-uploads
idempotent no-ops.

### Workflow doesn't trigger on tag

Tags must match the pattern `v*` (e.g. `v0.1.7`, not `0.1.7` or `release-0.1.7`).
Push with `git push origin v0.1.7` (note: not `git push --tags`, that's all
tags — fine, but more than needed).

### Want to re-run a failed release without a new tag

`release.yml` has `workflow_dispatch`. Either click "Run workflow" in the
Actions tab, or:

```bash
gh workflow run release.yml
```

---

## 8. Vercel / web pages

### Canonical URL returns 404 after the repo was renamed

The Vercel project's Git connection still points at the old repo URL.
Reconnect:

```bash
cd web
vercel git connect https://github.com/<owner>/<new-repo-name>
vercel deploy --prod
vercel alias set <new-deploy-url> portaldot-pdk.vercel.app
```

Future master pushes auto-deploy.

### `/demo/cast.json` returns 404 but the page loads

The asciinema-player has nothing to play. Check `web/demo/cast.json`
exists and is in the deployed commit. If yes, hard-refresh (Ctrl+F5) to
bust the cache.

### Pitch video doesn't play in browser

Mostly works in any modern browser (H.264 + AAC, mp4 container). On older
Safari, try downloading `/pitch.mp4` and playing locally.

---

## 9. Cross-platform quirks

### CRLF vs LF line ending warnings on git

Git is normalising line endings. Harmless. To silence:

```bash
git config core.autocrlf input   # POSIX
git config core.autocrlf true    # Windows
```

### Python finds the wrong interpreter

`py -3.12` on Windows explicitly picks 3.12. On POSIX, use a venv to pin.

### `python` vs `python3` (POSIX)

On modern Ubuntu, `python` doesn't exist; only `python3`. Either:

```bash
# alias it for the session
alias python=python3
# or use python3 -m pdk.cli
```

---

## 10. Diagnosing anything else

When the above doesn't apply, capture more context:

```bash
pdk doctor                  # node + AI state
pdk --version               # confirm version
python --version            # confirm interpreter
pip show portaldot-pdk      # install location + deps
```

Open an issue with all four outputs + the exact command that failed.
