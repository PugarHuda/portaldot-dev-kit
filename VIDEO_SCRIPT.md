# pdk — Pitch Video Narration (as rendered)

This is the **shipped** narration in `docs/pitch.mp4` (≈59 s, five segments).
The video is a hybrid: two slide-deck segments frame the problem, a real
asciinema recording of the pdk CLI runs the live demo, and two more slide
segments close with the uniqueness + outro.

Timings are measured from the actual rendered segments — use them when
re-recording or re-cutting.

---

## Segments

| # | Type      | Title slide / scene                       | Start  | End    | Duration |
|---|-----------|-------------------------------------------|--------|--------|----------|
| 0 | slide     | pdk — Portaldot Dev Kit (title)           | 0:00.0 | 0:07.0 | 7.0s     |
| 1 | slide     | The pain (raw `Module { index, error }`)  | 0:07.0 | 0:14.6 | 7.6s     |
| 2 | **live**  | **terminal recording (asciinema → mp4)**  | 0:14.6 | 0:43.6 | ~29.0s   |
| 3 | slide     | Why pdk wins (raw-code unique + POT gas)  | 0:43.6 | 0:54.3 | 10.7s    |
| 4 | slide     | Outro                                     | 0:54.3 | 0:59.1 | 4.8s     |

Total: **0:59.1** (`ffprobe docs/pitch.mp4`).

---

## Narration (word-for-word, matches `subs.srt`)

**[0:00 — seg-0 · title]** *(slide: pdk title)*
> "pdk, the Portaldot Dev Kit. It turns cryptic transaction failures into clear, actionable diagnoses."

**[0:07 — seg-1 · the pain]** *(slide: raw `Module { index, error }` code)*
> "Portaldot is brand-new and Rust-first. When a transaction fails, you get a raw error code, with no message and no fix."

**[0:14 — seg-2 · LIVE DEMO]** *(terminal recording — typed commands and their real outputs)*
> "Now watch pdk decode a real failure on a real local Portaldot node. Doctor confirms the chain. Accounts shows funded developers. Demo submits a failing transfer; FailLens decodes Balances Insufficient Balance with the fix. Explain decodes the raw module error code itself. Demo fix retries the corrected tx, and report summarises every failure on chain."

Commands executed on-screen during seg-2 (in order, real outputs):

1. `pdk doctor --no-liveness`
2. `pdk accounts`
3. `pdk debug --demo`
4. `pdk explain --module 6 --error 2`
5. `pdk debug --demo --fix`
6. `pdk report`

**[0:43 — seg-3 · why it wins]** *(slide: uniqueness — raw-code decoder + POT gas + tests)*
> "pdk is the only debugger for Portaldot — even decoding the raw error code itself. Real transactions, paying POT as gas. Open source, and fully tested."

**[0:54 — seg-4 · outro]** *(slide: outro / call-to-action)*
> "pdk, the standard Portaldot dev toolkit. Thank you for watching."

---

## How this was built

- **TTS:** `piper` (`en_US-lessac-medium.onnx`) on WSL for the slide narrations.
- **Slide segments:** `site/public/slide.html` rendered to PNG via Edge headless
  → `docs/_vid/slide{1,2,5,6}.png`; built with `-loop 1 -i <png> -i <narr.wav>`.
- **Live segment:** `record_demo.sh` runs the full demo flow under
  `asciinema rec`; `agg --speed 1.2 --theme monokai` converts the cast to GIF;
  ffmpeg converts the GIF to MP4 and overlays the seg-2 narration.
- **Composer:** `build_combined_pitch.sh` (concat=n=5, then burn subtitles
  from `subs.srt` measured against the rendered segment durations).
- **Output:** `docs/pitch.mp4` — H.264 + AAC, 1280×720, 25 fps.

## Re-rendering

To change any segment:

- **Slide narration** (seg-0/1/3/4) → edit `TEXT2`/`TEXT4`-equivalent in
  `rerender_pitch.sh` (now mostly superseded — slide builds live in
  `build_combined_pitch.sh`).
- **Live demo** → re-run `record_demo.sh` (it warms up two failures so
  `pdk report` has rows, records via asciinema, renders to MP4).
- **Final concat** → re-run `build_combined_pitch.sh` which re-builds
  `seg-live.mp4` (demo + narration) and concats the five segments.

```bash
wsl bash "/mnt/f/Hackathons/Hackathon Portaldot S1/start_node.sh"
wsl bash "/mnt/f/Hackathons/Hackathon Portaldot S1/record_demo.sh"
wsl bash "/mnt/f/Hackathons/Hackathon Portaldot S1/build_combined_pitch.sh"
```

The `subs.srt` is regenerated each build from the new measured durations, so
subtitles stay aligned even if a re-recorded segment is longer or shorter.

## Verifying alignment

The slide pixels and the subtitle text must say the same thing, and during
seg-2 the subtitle must match what's typed in the terminal. Spot-check three
frames after every re-render:

```bash
wsl bash -lc 'cd "/mnt/f/Hackathons/Hackathon Portaldot S1/docs" && \
  ffmpeg -ss 10 -i pitch.mp4 -frames:v 1 screens/pitch-seg1.png && \
  ffmpeg -ss 20 -i pitch.mp4 -frames:v 1 screens/pitch-livedemo.png && \
  ffmpeg -ss 50 -i pitch.mp4 -frames:v 1 screens/pitch-seg3.png'
```

Open the three PNGs and confirm: seg-1 still shows the "raw error code"
slide; the live-demo frame shows terminal output (e.g. `pdk doctor` panel)
with the seg-2 subtitle visible at the bottom; seg-3 shows the uniqueness
slide.
