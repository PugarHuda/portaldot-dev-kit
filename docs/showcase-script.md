# PortalDOT Winners Showcase — talking points (2026-06-15, 7:00 PM)

Slot framework per event invitation, in this order:

> 🔹 **Introduce** your project and vision
> 🔹 **Demonstrate** a live product demo
> 🔹 **Share** your development experience throughout the hackathon
> 🔹 **Discuss** future plans + how the project can keep growing in the ecosystem

Target run-time: **6–8 minutes total**, then Q&A. Sections below sized
roughly: 60 s intro · 2 min demo · 90 s journey · 90 s future · 30 s close.

---

## 🔹 1 — Project intro (~60 s)

> "Hi Portaldot, I'm Pugar — solo builder behind pdk, the Portaldot Dev
> Kit. pdk is the only debugger for Portaldot transactions.
>
> Here's the problem in one slide.
> *(switch to slide 2 — the raw `Module { index: 6, error: 2 }` block)*
> When a transaction fails on Portaldot, this is all the node tells you.
> No message, no fix, no hint of which pallet. The hackathon Q&A channel
> is full of *'how do I get POT?'* and *'what does this code mean?'* —
> those two questions are the #1 thing blocking new Portaldot builders.
>
> pdk answers both. *(switch to slide 3 — the 14-command grid)*
> One CLI. Fourteen commands. Every command pays POT as gas. Zero mocks.
> `pip install portaldot-pdk` — it's already on PyPI, version 0.1.6.
>
> The unique trick is *(switch to slide 5 — the 'why it wins' uniqueness
> slide)* — `pdk explain --module 6 --error 2`. We decode the raw module
> code itself, no transaction hash needed. Nothing else in the Portaldot
> ecosystem does this."

## 🔹 2 — Live demo (~2 min)

Two options, pick based on the room's screen-share latency:

**Option A — recorded asciinema replay** (deterministic, recommended):
Open https://portaldot-pdk.vercel.app/demo on the shared screen.
Scrub to ~14 s mark (after `pip install` finishes), then play through to
~45 s. Talk over it:

- "Doctor confirms we're on portaldot-1002, ink! 3.x only — important caveat I'll come back to."
- *(when accounts table appears)* "Alice has 49,999.98 POT — note the .02 deficit, that's two real fees from earlier warm-ups."
- *(at debug --demo)* "Real failing transaction. FailLens decodes Balances Insufficient Balance. The yellow panel is AI-suggested — auto-on because my OpenRouter key is in env."
- *(at explain --module 6 --error 2)* "Here it is. Raw code in, named error out. 202 entries verified against live portaldot-1002 metadata."
- *(at debug --demo --fix)* "Diagnose AND apply. Corrected transaction submitted, succeeds on-chain."

**Option B — live terminal** (if room can see your screen well):
Pre-start node in WSL. Run the same 5 commands. Backup: option A if anything stalls.

**One-liner to leave on screen during demo break:**
```bash
pip install portaldot-pdk && export PDK_AI_KEY=sk-or-v1-… && pdk doctor
```

## 🔹 3 — Development journey (~90 s)

Three honest moments, each with a learning:

1. **Day 1 spike** — pdk started as one assumption: "if Substrate has
   ExtrinsicFailed events with DispatchError, the chain's own metadata
   has every error name." Verified in 2 hours by manually walking the
   metadata over `substrate-interface`. That spike convinced me the
   whole product was possible.

2. **The substrate-interface signing bug** — when I tried to extend pdk
   to Assets pallet, signing failed on V13 metadata. Spent half a day
   debugging the upstream Python library, filed
   [polkascan/py-substrate-interface#9](https://github.com/polkascan/py-substrate-interface/issues/9).
   **Lesson:** Portaldot's Python builder audience is genuinely
   second-class right now vs JS. The TypeScript SDK I sketched as v0.2
   exists because of this exact pain.

3. **The mid-hackathon repo rename** — organizers announced the naming
   convention `portaldot-hackathon-2026-[project]-[team]` after some
   teams (including me) had already published. The rename broke
   **three** integrations in cascade: PyPI Trusted Publishing (OIDC pins
   to old repo name), Vercel auto-deploy webhook, and the GitHub release
   workflow. Total recovery: ~2 hours, including switching from OIDC to
   token-based PyPI auth so it survives future renames. **Lesson:** the
   `release.yml` token-auth pattern I documented in
   [CONTRIBUTING.md](../CONTRIBUTING.md) is now reusable by every team
   that gets bitten by this.

## 🔹 4 — Future plans + ecosystem fit (~90 s)

*(Switch to slide 7 — the new "What's next" slide)*

> "Four directions, in priority order:
>
> 1. **TypeScript SDK on @polkadot/api.** Unblocks the things Python
>    can't sign right now — Assets seeding, ink! contract deploy. Lets
>    pdk speak the full runtime, not just the native-pallet subset.
>
> 2. **Community-owned knowledge base.** 29 entries today. Every error
>    a Portaldot dev hits and writes a fix for is a 5-line YAML PR that
>    helps the next dev. Build the network effect.
>
> 3. **Editor extensions** — VS Code first. Hover a raw module code in
>    your terminal output and get the decoded error inline. Move
>    FailLens into the IDE where most builders actually live.
>
> 4. **Public-RPC ready.** pdk already works against any reachable
>    Portaldot WebSocket endpoint. When the official testnet RPC lands,
>    it's a one-flag swap: `--node wss://testnet.portaldot.io`. Zero
>    code changes.
>
> What I'm asking from the Portaldot core team:
>
> - Make pdk the official debugging tool in the new-developer onboarding flow.
> - Co-maintain the verified runtime index so it auto-updates on
>   runtime upgrades (currently I regenerate manually with
>   `extract_index.py`).
> - Builder-channel access + a grant to fund the v0.2 TypeScript SDK
>   work."

## 🔹 5 — Close (~30 s)

*(Switch to slide 8 — close slide with links)*

> "pdk on PyPI today: `pip install portaldot-pdk`.
> Live demo in the browser at portaldot-pdk.vercel.app/demo.
> 81-second pitch on YouTube — link in the slide.
>
> Thanks to the Portaldot team for an excellent hackathon, and to the
> mentors who jumped on questions in Discord. Let's make Portaldot easy
> to build on. Happy to take questions."

---

## Pre-event checklist (do 30 min before)

- [ ] Restart WSL node, run `pdk doctor` to confirm 1002 + AI configured
- [ ] Open https://portaldot-pdk.vercel.app/demo in a clean browser tab
      (cache-busted: append `?cb=` + random string)
- [ ] Open pitch deck at https://portaldot-pdk.vercel.app/slide,
      verify slide #7 (new What's next) and #8 (close) render
- [ ] Open YouTube https://youtu.be/EPNIRRc3qnw in another tab as fallback
- [ ] Have terminal ready with `PDK_AI_KEY` exported
- [ ] Test screen-share at the showcase room ~10 min before slot
- [ ] Mute Discord notifications during talk
- [ ] Water on the table

## Likely Q&A — pre-baked answers

**Q: Why Python and not Rust/JS?**
A: Python is where the data + AI + scripting crowd lives — exactly the
audience that finds blockchain CLIs intimidating. PyPI lets every
Python dev `pip install portaldot-pdk` in one command. The TypeScript
companion SDK in v0.2 covers the Assets + ink! deploy gap.

**Q: Doesn't AI grounding still hallucinate?**
A: The AI panel is *always* labelled "AI-suggested — UNVERIFIED" with a
yellow border, rendered next to the verified KB entry (red/cyan
border). The verified KB stays the source of truth. AI is the long-tail
safety net for errors not yet in the KB.

**Q: Is this just `pip install` then I'm done, or do I need a node?**
A: Half the commands need no node (`explain`, `keys`, `ai-setup`,
`--help`). For chain commands, you need a local Portaldot dev node in
WSL. When public testnet RPC lands, `--node wss://...` works
immediately — no code change needed.

**Q: What about ink!?**
A: pdk uses native pallets, not ink!. That sidesteps the "Portaldot
v2.0.0 ships Contracts API v5 = ink! 3.x only" caveat that several
hackathon entries had to declare as a mock. When Portaldot upgrades
to Contracts API v6 + ink! 5, pdk gets ink! support as part of v0.2's
TypeScript path via @polkadot/api-contract.

**Q: Will you keep maintaining this after the hackathon?**
A: Yes. The release pipeline auto-publishes to PyPI on every `v*` tag,
CI runs on every push, the comprehensive QA harness catches
regressions. Built to outlast the hackathon. Looking forward to
building the v0.2 TypeScript SDK with grant support.
