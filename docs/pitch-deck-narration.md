# Pitch Deck Narration — slide-by-slide voiceover

**For: the 9-slide pitch deck at `/slide` (live URL: https://portaldot-pdk.vercel.app/slide).**

What mas says **while each slide is on screen**, slide-by-slide. Calibrated for ~4 minutes total if read at a calm pace (~145 wpm). Each section's `Slide cue` is the visual hook that tells mas when to start reading the next block.

Tonight's showcase is ~6-8 min slot. Plan:
1. Open with slide deck (Slides 1-5 ≈ 2 min)
2. Switch to live demo video (≈ 3-4 min, separate narration file: `docs/live-demo-narration.md`)
3. Return to slide deck (Slides 6-9 ≈ 2 min)
4. Take Q&A

OR — if showcase prefers everything in the deck — keep slides on screen the whole time and read both narrations in sequence. The slide deck already has terminal screenshots on slides 4 and 5 that hint at the live flow.

---

## Pre-flight (do 30s before going live)

- Open https://portaldot-pdk.vercel.app/slide in a presenter tab
- Press `Home` to jump to slide 1 (or `1` then `Enter`)
- Have this narration open in a second monitor / phone
- Have the live demo video (or terminal) ready as a tab/window
- Take one deep breath

---

## SLIDE 1 — Title (winner badge)

*Slide cue: green "🏆 1st Place" kicker is visible at top. The big "pdk." logo is centered.*

> **"Thanks for having me. I'm Pugar, solo builder behind pdk — the Portaldot Dev Kit. Today I want to show you the project that just won first place in Builder Tools, and walk you through the story behind it.*"*
>
> *(pause 1s, then press → to advance to slide 2)*

---

## SLIDE 2 — Problem

*Slide cue: the dark terminal box appears showing `ExtrinsicFailed: DispatchError { Module: { index: 6, error: 2 } }`*

> **"This is the problem. When a transaction fails on Portaldot, this is exactly what the chain returns to you. A module index, an error index, no name, no message, no fix."**
>
> *(pause 1s)*
>
> **"Portaldot is brand new. Rust-first. In Season 1 every developer runs it from a local node. And the hackathon Q&A channel was full of two questions: *how do I get POT?* and *what does this error code mean?* — those were the two things blocking every new builder."**
>
> *(press → for slide 3)*

---

## SLIDE 3 — Solution

*Slide cue: 8 command cards in a grid (pdk up, pdk accounts, pdk debug, etc) plus a line about "fourteen commands in one CLI"*

> **"pdk answers both. One command-line tool. Fourteen commands covering the whole local dev loop — starting a node, getting POT into a fresh account, decoding errors, querying the runtime, real on-chain transfers, AI-assisted diagnosis."**
>
> *(pause 1s)*
>
> **"Every command speaks the chain directly. Every transaction pays POT as gas. Zero mocks, declared. And it's already on PyPI — `pip install portaldot-pdk`, version 0.1.6, anyone can install it right now."**
>
> *(press → for slide 4)*

---

## SLIDE 4 — FailLens hero (terminal screenshot)

*Slide cue: terminal panel showing `pdk debug --demo` output with "✗ Balances.InsufficientBalance" + "What happened" + "How to fix"*

> **"This is the hero feature — FailLens. The same failing transaction, decoded. ✗ Balances Insufficient Balance. Plain-language explanation. Numbered fix steps."**
>
> *(pause 1s)*
>
> **"The decoder is metadata-driven — it reads the chain's own type registry, so it never goes stale across runtime upgrades. The knowledge base has 29 curated entries, every single key verified against the live `portaldot-1002` runtime."**
>
> *(press → for slide 5)*

---

## SLIDE 5 — Live monitor (terminal screenshot)

*Slide cue: another terminal showing live event watch or report output*

> **"And it works live too. `pdk debug --watch` is a live monitor that decodes every failure as it lands on chain. `pdk report` aggregates failures across recent blocks, grouped by type — triage at a glance."**
>
> *(pause 1s)*
>
> **"Let me show you the whole thing running end-to-end."**
>
> *(switch tabs to the live demo video — or to your terminal — then read `docs/live-demo-narration.md`. Returns to slide 6 after the demo.)*

---

## ⏸ INTERMISSION — play the live demo video

*Switch from slide deck to the live demo video.*
*Read from `docs/live-demo-narration.md` (≈ 3 min 50 s).*
*When narration ends, switch back to slide deck and advance to slide 6.*

---

## SLIDE 6 — Why it wins

*Slide cue: "The only debugger for Portaldot" + 6 bullet points (Unique / Native / Application value / Adoption-ready / Aligned / Quality)*

> **"Here's why this won Builder Tools."**
>
> *(pause 1s, then walk through bullets pointing at each as you read)*
>
> **"Unique — pdk is the only thing in the Portaldot ecosystem that decodes the raw `Module { index, error }` code. Nothing else does this. Native — real transactions, POT paid as gas, no ink! caveat because we use native pallets. Application value — directly solves the ecosystem's #1 documented onboarding pain. Adoption-ready — `pip install` works today, with CI-gating mode and a community-owned knowledge base. And the quality — 40 unit tests plus 84 integration and stress checks, all green, no mocks."**
>
> *(press → for slide 7)*

---

## SLIDE 7 — The journey

*Slide cue: "Three honest moments from this hackathon" header + 3 bullet items*

> **"Quick story on how we got here. Three honest moments."**
>
> *(pause 1s)*
>
> **"Day one — a two-hour spike. I walked the chain's metadata manually, just to test one assumption — that every error must have a name on-chain. It did. That single proof convinced me the whole product was possible. Started writing the decoder that night."**
>
> *(pause 1s)*
>
> **"Mid-hackathon — I tried to extend pdk to the Assets pallet. Signing failed. Half a day debugging revealed a bug in the upstream Python library, `substrate-interface`, that mis-signs custom pallet calls on Portaldot's V13 metadata. I filed it as issue #9 — link in the slide. The lesson: Python builders are second-class citizens on Portaldot today. That's why v0.2 — TypeScript SDK — is on the roadmap."**
>
> *(pause 1s)*
>
> **"And third — the repo rename. Mid-event the organizers announced a naming convention. The rename broke three integrations in cascade — PyPI Trusted Publishing, Vercel auto-deploy, and the GitHub release workflow. Two hours of recovery, and I switched the release pipeline to token-based auth so it's now rename-proof. Documented in `CONTRIBUTING.md` for every team that hits this next."**
>
> *(pause 1s)*
>
> **"Every pain became part of the product. Every fix is in the repo."**
>
> *(press → for slide 8)*

---

## SLIDE 8 — What's next

*Slide cue: "From hackathon entry to ecosystem infrastructure" + 5 roadmap bullets*

> **"And here's what's next. Five directions, all already scoped."**
>
> *(pause 1s)*
>
> **"First — TypeScript companion SDK on @polkadot/api. Unlocks the things Python can't sign right now — Assets seeding, ink! contract deploy. Lets pdk speak the full runtime, not just native pallets."**
>
> *(pause 1s)*
>
> **"Second — community-owned knowledge base. 29 entries today. Every error a Portaldot dev hits and writes a fix for is a 5-line YAML PR. Network effect that compounds."**
>
> *(pause 1s)*
>
> **"Third — editor extensions. VS Code first. Hover any raw module code in your terminal and see the decoded error inline. Move FailLens into the IDE where developers actually live."**
>
> *(pause 1s)*
>
> **"Fourth — public-RPC ready. pdk already works against any reachable Portaldot WebSocket endpoint. When the official testnet RPC lands, it's a one-flag swap. Zero code changes needed."**
>
> *(pause 1s)*
>
> **"And the ask — I'd love to see pdk become the official debugging tool in the new-developer onboarding flow. Builder-channel access, a grant to fund the v0.2 TypeScript work, and ongoing collaboration with the Portaldot core team."**
>
> *(press → for slide 9)*

---

## SLIDE 9 — Close

*Slide cue: "The standard Portaldot dev toolkit" + links (GitHub, vercel, YouTube)*

> **"That's pdk. On PyPI today — `pip install portaldot-pdk`. Live demo in the browser at portaldot-pdk dot vercel dot app slash demo. 81-second pitch and the full e2e walkthrough on YouTube — link's on the slide."**
>
> *(pause 1s)*
>
> **"Thanks again to the Portaldot team for an excellent hackathon, and to the mentors who helped throughout. Let's make this chain easy to build on. I'm happy to take questions."**
>
> *(hold on slide 9 during Q&A)*

---

## Q&A — pre-baked short answers

**"Why Python and not Rust or JavaScript?"**
> Python is where the AI, data, and scripting crowd lives. PyPI lets any of them install pdk in one command. The TypeScript SDK in v0.2 covers the gap for Assets and ink! contract deploy.

**"Does the AI section hallucinate?"**
> The AI panel is always labelled "AI-suggested — UNVERIFIED" with a yellow border. It renders next to the verified KB panel which is the source of truth. AI is the safety net for the long tail; the curated KB is the official answer.

**"Do I need a node to use pdk?"**
> Half the commands work offline — `explain`, `keys`, `ai-setup`, `--help`. For chain commands you need a local Portaldot node in WSL. When public testnet RPC lands, just point `--node` at it.

**"What about ink! contracts?"**
> pdk uses native pallets, not ink! — that sidesteps the "ink! 4+ doesn't deploy on Portaldot v2.0.0" caveat that several hackathon entries had to declare as a mock. ink! support comes in v0.2 through @polkadot/api-contract.

**"Will you keep maintaining this after the hackathon?"**
> Yes. The release pipeline auto-publishes to PyPI on every `v*` tag, CI runs on every push, the comprehensive QA harness catches regressions. Built to outlast the hackathon. Looking forward to v0.2 work with grant support.

**"Can the community contribute to the knowledge base?"**
> Yes — five-line YAML PRs to `pdk/data/error_fixes.yaml`. Every contributor improves debugging for the whole ecosystem. `CONTRIBUTING.md` walks through it. The verified runtime index regenerates from chain metadata via `extract_index.py`, so it stays current automatically across runtime upgrades.

---

## Producer notes

- **Confident, not hyped.** No "amazing", "powerful", "revolutionary". Let the numbers do the bragging (29 entries, 202 indices, 14 commands, 40 + 84 tests, 1st place).
- **Pauses are load-bearing.** After punchlines, especially "nothing else does this" (slide 6) and "first place" (slide 1), give the audience 1-2 seconds to register. Don't rush.
- **Voice the kicker first.** The small uppercase tagline at the top of each slide is the slide's "topic title" — say it (or paraphrase) before the main content. Audience tracks by topic, not by visual position.
- **Eye contact > slide-watching.** Glance at the slide, then look at camera/audience. The slide is *for them*, not for you.
- **If a slide doesn't load,** keep talking. The slide content is reinforcement, not your script. Most of what you're saying is in this doc, not on the slide.
