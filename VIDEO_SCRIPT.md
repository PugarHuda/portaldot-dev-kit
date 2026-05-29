# pdk — Pitch Video Narration (as rendered)

This is the **shipped** narration in `docs/pitch.mp4` (≈67s, six segments).
Timings are measured from the actual segment durations — use them when
re-recording or re-cutting.

The video is a **slide-deck pitch**, not a screen recording. The live screen
walkthrough lives in `DEMODAY_SCRIPT.md` (rehearsal companion) and is the
artifact used in the on-stage demo.

---

## Segments

| # | Title slide                          | Start  | End    | Duration |
|---|--------------------------------------|--------|--------|----------|
| 0 | pdk — Portaldot Dev Kit (title)      | 0:00.0 | 0:07.0 | 7.0s     |
| 1 | The pain (raw error code)            | 0:07.0 | 0:14.6 | 7.6s     |
| 2 | One CLI, thirteen commands           | 0:14.6 | 0:28.6 | 14.0s    |
| 3 | Live demo highlights                 | 0:28.6 | 0:51.7 | 23.2s    |
| 4 | Why pdk wins (raw-code unique)       | 0:51.7 | 1:02.4 | 10.7s    |
| 5 | Outro                                | 1:02.4 | 1:07.2 | 4.8s     |

Total: **1:07.2** (`ffprobe docs/pitch.mp4`).

---

## Narration (word-for-word, matches `subs.srt`)

**[0:00 — seg-0 · title]** *(slide: pdk title)*
> "pdk, the Portaldot Dev Kit. It turns cryptic transaction failures into clear, actionable diagnoses."

**[0:07 — seg-1 · the pain]** *(slide: raw `Module { index, error }` code)*
> "Portaldot is brand-new and Rust-first. When a transaction fails, you get a raw error code, with no message and no fix."

**[0:14 — seg-2 · the solution]** *(slide: 13 commands list — `up · accounts · debug · explain · doctor · simulate · seed · pallets · send · storage · watch · keys · report`)*
> "pdk is one command line tool for the whole local dev loop — thirteen commands, from starting a node and finding your POT, to sending, debugging, simulating, seeding, exploring the chain, and reporting every failure."

**[0:28 — seg-3 · live highlights]** *(slide: FailLens panel + simulate fee + storage/pallets/keys)*
> "Watch it live. Funded dev accounts. A real POT transfer. FailLens decodes a failing transaction into plain language, with a fix. Simulate previews a fee before you send. Storage reads chain state, pallets browses the runtime, and keys manages accounts."

**[0:51 — seg-4 · why it wins]** *(slide: uniqueness — raw-code decoder + POT gas + tests)*
> "pdk is the only debugger for Portaldot — even decoding the raw error code itself. Real transactions, paying POT as gas. Open source, and fully tested."

**[1:02 — seg-5 · outro]** *(slide: outro / call-to-action)*
> "pdk, the standard Portaldot dev toolkit. Thank you for watching."

---

## How this was built

- TTS: **piper** (`en_US-lessac-medium.onnx`) on WSL.
- Slides: `site/public/slide.html` (Next.js page) rendered to PNG via Edge
  headless → `docs/_vid/slide{1..6}.png`.
- Composer: `rerender_pitch.sh` (six `-loop 1 -i slide -i narr.wav` ffmpeg
  builds, then `concat=n=6:v=1:a=1` and burn-in subtitles from `subs.srt`).
- Output: `docs/pitch.mp4` (H.264 + AAC, 1920×1080-ish, ≤30fps).

## Re-rendering

To change a single segment without retouching the rest, edit `TEXT2` / `TEXT4`
in `rerender_pitch.sh` and re-run:

```bash
wsl bash "/mnt/f/Hackathons/Hackathon Portaldot S1/rerender_pitch.sh"
```

The script reuses unchanged `seg-0`, `seg-1`, `seg-3`, `seg-5` from
`~/vidwork/`, rebuilds the requested two, re-concats, and regenerates
`subs.srt` from the **new** measured durations (so subtitles stay in sync
even if the new TTS is a different length).

## Verifying alignment

The slide pixels and the subtitle text must say the same thing. Spot-check
two frames after every re-render:

```bash
wsl bash -lc 'cd "$(dirname "$0")/docs" && ffmpeg -ss 20 -i pitch.mp4 -frames:v 1 screens/pitch-seg2.png && ffmpeg -ss 60 -i pitch.mp4 -frames:v 1 screens/pitch-seg4.png'
```

…then open both PNGs and confirm the burned-in subtitle matches the slide
copy (e.g. seg-2 should say *"thirteen commands"* on the slide and in the
caption; seg-4 should say *"only debugger … raw error code"*).
