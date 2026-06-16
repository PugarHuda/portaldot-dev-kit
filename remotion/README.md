# pdk — Remotion production video

Source for the polished community-voting video. Wraps the captioned
terminal demo with an animated intro, on-screen annotations during
key commands (debug --demo, explain, debug --fix), and an outro
CTA card.

## Output

- `out/pdk-voting.mp4` — 1920×1080 @ 30 fps, ~2:43, h264 crf 22

## Build

```bash
npm install
cp ../web/live-demo-captioned.mp4 public/
npm run dev        # interactive studio at localhost:3000
npm run build      # render to out/pdk-voting.mp4
```

## Structure

- `src/Composition.tsx` — top-level `<Sequence>` stack
- `src/scenes/Intro.tsx` — title sequence (winner badge → logo → tag)
- `src/scenes/DemoEmbed.tsx` — `<OffthreadVideo>` of the captioned demo
  + spring-animated annotation popups + corner watermarks
- `src/scenes/Outro.tsx` — vote CTA + links + tagline

Annotation timings (`ANNOTATIONS` in `DemoEmbed.tsx`) are in seconds
relative to the embedded mp4, calibrated against the same frames used
to time `docs/sub/live-demo.ass`.

## License

Same as the parent repo.
