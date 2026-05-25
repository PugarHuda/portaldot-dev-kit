# Recording the demo GIF

A short looping GIF of `pdk debug --watch` decoding a live failure is the single
highest-impact visual for the README and the landing page. Aim for **8–12
seconds**, a small window, and a large, readable font.

## What to capture

A two-pane terminal:

- **Left:** `pdk debug --watch`
- **Right:** `pdk debug --demo` (run it once or twice)

The GIF should show a failure appearing in the left pane, decoded into the
`✗ Balances.InsufficientBalance` panel, in real time.

> Purge + restart the node first (see `DEMO.md` pre-flight) so the chain is
> producing blocks, otherwise nothing will be decoded.

## Option A — ScreenToGif (Windows, easiest)

1. Install ScreenToGif (https://www.screentogif.com/).
2. Open the Recorder, size the frame over your terminal, record the scene above.
3. Editor → remove dead frames, then Save As → **GIF** (or APNG).
4. Save to `docs/demo.gif` in this repo.

## Option B — asciinema + agg (terminal-native, crisp)

Inside WSL:

```bash
pipx install asciinema      # or: pip install asciinema
asciinema rec watch.cast    # run the two-pane scene, then exit (Ctrl-D)

# convert to GIF with agg (https://github.com/asciinema/agg)
agg watch.cast docs/demo.gif
```

## After recording

1. Keep the file small (< 3 MB ideally) — trim length and width.
2. Commit it:
   ```bash
   git add docs/demo.gif && git commit -m "Add demo GIF" && git push
   ```
3. Add it to the README under the Demo section:
   ```markdown
   ![pdk FailLens decoding a failed transaction live](docs/demo.gif)
   ```
4. Optional: also reference it on the landing page (`web/index.html`).
