# Community voting submission — pdk (Portaldot Dev Kit)

For Titus / the voting channel. Paste **TEXT INTRODUCTION** as the
written intro; submit the YouTube link as the demo video.

---

## TEXT INTRODUCTION (paste this verbatim)

**pdk — Portaldot Dev Kit**
🏆 1st place · Builder Tools · Portaldot Online Mini Hackathon S1

When a transaction fails on Portaldot, the chain returns a raw code —
`Module 6, error 2` — with no name, no message, no fix. pdk turns
those codes into clear, actionable diagnoses, live, in your terminal.

**Hero feature: FailLens** — decode any failed Portaldot transaction
into a named error, plain-language explanation, and numbered fix
steps. The decoder reads the chain's own runtime metadata, so it
never goes stale across runtime upgrades. 202 error indices verified
against `portaldot-1002`.

**Fourteen commands in one CLI** covering the full local dev loop:
`doctor`, `accounts`, `pallets`, `storage`, `keys`, `simulate`,
`send`, `seed`, `debug`, `explain`, `report`, `watch`, `ai-setup`,
plus the `--demo`/`--fix` modes on `debug`. Every chain command
spends real POT as gas — zero mocks declared.

**Available right now** — `pip install portaldot-pdk` (v0.1.6 on PyPI).
40 unit tests + 84 integration & stress checks, all green.

**Why it matters for the ecosystem** — Portaldot's #1 documented
onboarding pain is the "what does this error code mean?" question
in the Discord. pdk solves it as a five-second CLI call. The
knowledge base is community-owned: every new Portaldot dev who
hits an undecoded error contributes a five-line YAML PR, and the
next dev's life gets easier.

**Roadmap** — v0.2 brings a TypeScript companion SDK on
`@polkadot/api` (unblocks Assets + ink! contract deploy that Python
`substrate-interface` can't sign on V13 metadata — an upstream bug
I diagnosed mid-hackathon and filed at
[polkascan/py-substrate-interface#9](https://github.com/polkascan/py-substrate-interface/issues/9)).
After v0.2: VS Code extension for inline error decoding, plus
public-RPC support — pdk is already one-flag-ready
(`--node wss://testnet.portaldot.io`).

**Links**
- 📦 PyPI: https://pypi.org/project/portaldot-pdk/
- 💻 GitHub: https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang
- 🌐 Site: https://portaldot-pdk.vercel.app
- 🎬 Demo: https://youtu.be/EPNIRRc3qnw
- 🎤 Pitch deck: https://portaldot-pdk.vercel.app/slide

Built solo by Pugar Huda Mantoro. Built to outlast the hackathon —
auto-publish on every `v*` tag, CI on every push, comprehensive QA
harness. Vote pdk if you want Portaldot to be easier to build on. 🛠️

---

## DEMO VIDEO — which one to send

Three versions exist; pick by audience:

### 🏆 Recommended for the voting channel — `docs/pdk-voting.mp4`

- **1920×1080, 2:42, 11.7 MB, h264**
- Production cut, made for this voting submission:
  - Animated title sequence (winner badge → pdk logo → tagline)
  - Full captioned terminal demo embedded as the middle
  - On-screen annotation popups during the hero moments
    (THE HERO at `debug --demo`, UNIQUE at `explain`, etc.)
  - Persistent corner watermark + GitHub URL
  - Vote-CTA outro card with `pip install portaldot-pdk`
- Local path: `docs/pdk-voting.mp4`
- Built with Remotion v4 — source at `remotion/`, regenerable
  with `npm run build`.

**Upload steps:**
1. Upload `docs/pdk-voting.mp4` to YouTube (unlisted is fine).
2. Send Titus the YouTube link + the text intro below.

### Backup A — captioned terminal only (`web/live-demo-captioned.mp4`)

- 978×900, 2:27, 4.5 MB
- Same captioned demo that's embedded in `pdk-voting.mp4`, without
  the Remotion wrapper. Use this if Titus wants the raw demo with
  no production framing, or if upload size is constrained.
- Direct CDN: https://portaldot-pdk.vercel.app/live-demo.mp4 is the
  uncaptioned source — for the captioned version, use the local file
  or upload to YouTube.

### Backup B — existing YouTube (`https://youtu.be/EPNIRRc3qnw`)

- 81 seconds, already public
- Older 1-minute pitch+demo; lacks the production polish of
  `pdk-voting.mp4` but has its own narration and is already indexed.

---

## DM REPLY TO TITUS (paste verbatim if you want a quick reply)

> Hi Titus — ready for the voting channel.
>
> **Project intro:** see attached text (pdk — Portaldot Dev Kit,
> 1st place in Builder Tools — turns raw Portaldot transaction
> failures into human-readable diagnoses, 14 commands, on PyPI today).
>
> **Demo video:** [YouTube link to docs/pdk-voting.mp4 once uploaded]
> — 2:42, 1080p, full terminal walkthrough wrapped with title
> animation, on-screen annotations during the hero commands, and
> a CTA outro. Older 81-second cut also available at
> https://youtu.be/EPNIRRc3qnw.
>
> Links bundle:
> - GitHub: https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang
> - PyPI: `pip install portaldot-pdk`
> - Site + pitch deck: https://portaldot-pdk.vercel.app
>
> Happy to provide any other format you need. Thanks for organizing
> the showcase — looking forward to the voting period.

---

## Producer notes

- **Hook is the first sentence.** Voters scroll. If the first line
  doesn't grab them, they don't read paragraph two.
- **Five-second test.** Read the intro out loud. If you can't say
  "what pdk does" in five seconds from the first paragraph, it's
  too dense.
- **Concrete numbers > adjectives.** 202 indices, 14 commands, 40+84
  tests, 1st place — these stick. "Comprehensive" and "powerful"
  don't.
- **Link order matters.** PyPI first (immediate proof-of-shipping),
  GitHub second (audit), demo video third (the actual sell).
