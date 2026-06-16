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

**Recommended:** the existing YouTube link — `https://youtu.be/EPNIRRc3qnw`

Why this one (vs. the silent 2:27 `live-demo.mp4`):
- It's already public, hosted, indexed — no upload friction for the
  voting channel.
- It has voiceover/narration baked in, so judges + community can
  watch it without context.
- It's 81 seconds — short enough that voters actually finish it.
- The longer 2:27 `live-demo.mp4` is silent (built for live
  voiceover during the showcase). Without narration it doesn't
  read as well outside a presentation setting.

**Alternative**, if Titus prefers a longer/more thorough cut:
- Upload `web/live-demo.mp4` (2:27, silent) to YouTube with the
  QUICK 2:27 MODE narration script from `docs/live-demo-narration.md`
  as either a voiceover or subtitle track. Roughly 30 minutes of
  extra work in any video editor (record voice, sync, export, upload).

**Backup link to reference in DM** if Titus asks for raw file:
- Direct CDN: https://portaldot-pdk.vercel.app/live-demo.mp4 (3.88 MB)

---

## DM REPLY TO TITUS (paste verbatim if you want a quick reply)

> Hi Titus — ready for the voting channel.
>
> **Project intro:** see attached text (pdk — Portaldot Dev Kit,
> 1st place in Builder Tools — turns raw Portaldot transaction
> failures into human-readable diagnoses, 14 commands, on PyPI today).
>
> **Demo video:** https://youtu.be/EPNIRRc3qnw (81 s, narrated
> pitch + end-to-end walkthrough).
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
