# Live-demo narration (record-ready voiceover script)

**For: a full live-demo video covering all 14 commands of pdk.**

Pair this with **one of**:
- `web/demo-e2e.mp4` (52 s silent terminal cast, pip install → 14 cmds)
- The asciinema replay at `web/demo/cast.json` rendered live
- A fresh OBS screen recording of mas's own terminal

Total spoken length: **~3 min 50 s** at a calm 145 words/minute. If mas
records faster, video and narration end together; if slower, just pause
on the last frame.

---

## Format guide

- **Bold cues in brackets** like `[CUE: doctor table appears]` =
  visual landmark mas should be on when reading the next line. Don't
  read these aloud.
- `(pause 1s)` = explicit beat. Helps pacing.
- *italic* = optional emphasis when speaking; not a script direction.
- Section dividers `———` = if mas wants to pause + breathe between segments.

Read in a calm, confident pace. Smile lightly — voice quality changes.
Don't rush after the punchlines.

---

## SCRIPT

[CUE: black screen / pdk logo / title slide visible]

> **"Portaldot is brand new. When a transaction fails on it, this is
> what the chain tells you."**
>
> *(pause 1s)*
>
> **"A module index. An error index. No name. No message. No fix."**
>
> *(pause 1s)*
>
> **"My name is Pugar. I built pdk — the Portaldot Dev Kit — to make
> that error legible. And then I went further. Let me show you the
> whole thing, end to end, from a clean Python virtual environment."**

———

[CUE: terminal opens, `$ python3 -m venv ~/demo-venv` visible]

> **"Fresh venv. Activate it. Install pdk from PyPI — one command,
> portaldot-pdk, version 0.1.6, already public."**

[CUE: `$ pip install portaldot-pdk` running, then `pdk --version` → `pdk 0.1.6`]

> **"Confirm the version. Now we have fourteen commands waiting."**

———

[CUE: `$ pdk doctor --no-liveness` → table renders]

> **"`pdk doctor` is the first command anyone runs. Endpoint, chain,
> runtime version 1002, thirty-one pallets. Contracts pallet present —
> but ink! 3.x only, important caveat. And a new row: AI configured,
> auto-on. We'll see why in a minute."**

[CUE: `$ pdk accounts` → balances table]

> **"`pdk accounts` answers the most-asked question on the Portaldot
> Discord: how do I get POT? You don't need a faucet. Alice, Bob,
> Charlie are pre-funded on the dev chain. Notice Alice has forty-nine
> thousand nine hundred ninety-nine point ninety-eight — point
> oh-two off the round number. That's two warm-up demos already
> burning real POT as fee."**

[CUE: `$ pdk pallets | head -10` → table of 31 pallets]

> **"`pdk pallets` browses the entire runtime. Thirty-one pallets,
> straight from the chain's metadata. Assets, Authority, Balances,
> Bounties — this is the surface you have available."**

[CUE: `$ pdk storage System Number` → block number]

> **"`pdk storage` reads any value off-chain. Here, the current block
> number. Same call works for any pallet, any storage item."**

[CUE: `$ pdk keys //Alice` → SS58 + public key table]

> **"`pdk keys` inspects or generates keypairs. No node needed. SS58
> format forty-two — Portaldot's standard."**

———

[CUE: `$ pdk simulate --amount 5 --no-ai` → fee preview table]

> **"`pdk simulate` previews a transfer's fee and feasibility before
> you send it. Five POT transfer would cost zero point zero one four
> seven oh three POT in fees, and the prediction says it would
> succeed. The runtime doesn't have system dry-run, so I built this
> from the real fee oracle plus the sender's actual balance."**

[CUE: `$ pdk send //Bob --amount 1 --from //Alice` → ✓ sent + tx hash]

> **"`pdk send` is a real on-chain POT transfer. One POT from Alice
> to Bob. Transaction hash printed — that's the actual hash on the
> Portaldot dev node, with POT paid as gas. No mocks anywhere."**

[CUE: `$ pdk seed` → funded Dave / Eve / Ferdie messages]

> **"`pdk seed` funds extra dev accounts from a YAML fixture. Dave,
> Eve, Ferdie — useful when you need realistic starting state for
> integration tests."**

———

[CUE: `$ pdk debug --demo` → FailLens panel + AI panel both render]

> **"And here it is. The hero. `pdk debug --demo` submits a real
> *failing* transaction and decodes it."**
>
> *(pause 1.5s — let both panels render)*
>
> **"Two panels side by side. The red one is FailLens — Balances
> Insufficient Balance, what happened, how to fix, all from the
> verified knowledge base. The yellow one is AI-suggested — auto-on
> because my OpenRouter key is in environment. No `--ai` flag
> needed. Grounded in chain metadata, clearly labelled UNVERIFIED.
> The verified KB stays the source of truth; AI is the long-tail
> safety net."**

[CUE: `$ pdk explain --module 6 --error 2 --no-ai` → raw code → named error]

> **"This is the unique trick. `pdk explain --module 6 --error 2`.
> No transaction hash. No error name. Just the raw module index and
> error index — exactly what a Portaldot node prints when it
> rejects something. pdk resolves it to Balances Insufficient Balance
> via a two-hundred-and-two-entry runtime index extracted live from
> portaldot-1002 metadata. Nothing else in the Portaldot ecosystem
> decodes this code."**

[CUE: `$ pdk debug --demo --fix --no-ai` → diagnose + ✓ Fixed]

> **"`pdk debug --demo --fix` does both. Diagnose the failure, then
> automatically submit the corrected transaction. The fix lands
> on-chain — diagnose to remediate in one command."**

[CUE: `$ pdk report --no-ai` → grouped failures table]

> **"`pdk report` scans recent blocks and groups every failure by
> type. Triage at a glance. For a flaky integration this is your
> dashboard."**

———

[CUE: `$ timeout 3 pdk watch --pallet Balances` → events stream then ends]

> **"`pdk watch` streams chain events live. Filter by pallet if you
> want — here, only Balances events. Three-second timeout for the
> recording. In real use, you leave it running and see failures the
> moment they land."**

[CUE: `$ pdk ai-setup` → wizard walkthrough panel]

> **"And the last one, `pdk ai-setup` — a wizard for the optional AI
> layer. Shows current configuration, points you at OpenRouter's free
> tier, prints the exact export command for your shell. Removes the
> 'where do I even put the key' friction for first-time users."**

———

[CUE: terminal cleared / pdk logo / split-screen showing repo + PyPI page]

> **"That's all fourteen commands. Every chain command spent real
> POT. Zero mocks declared. Forty pytest unit tests plus eighty-four
> integration and stress checks, all green. The pitch video and an
> in-browser asciinema replay are at portaldot-pdk.vercel.app — and
> the whole thing is `pip install portaldot-pdk` away."**
>
> *(pause 1s)*
>
> **"pdk just won first place in the Portaldot Mini Hackathon Season
> One. Builder Tools track. Next stop: TypeScript companion SDK,
> editor extensions, community-owned knowledge base. Thanks
> Portaldot — let's make this chain easy to build on."**

[CUE: hold last frame for 2 seconds before cut]

---

## Notes for the recorder

- **Microphone**: use any decent USB mic; built-in laptop mic is
  acceptable but pick up less keyboard noise if you stop typing
  during reads.
- **Background**: quiet room, no echo. Throw a hoodie over your head
  if the room is reverberant — sounds dumb, works great.
- **Take it slow.** If a sentence stumbles, pause two seconds and
  re-read just that sentence. You can edit out the pause in any
  editor (Audacity, OBS post, Premiere — all free).
- **Pacing target**: about 145 words per minute. If you finish the
  whole script in under 3 minutes, you spoke too fast.
- **The "pause Xs" markers matter.** Audiences need a beat after
  punchlines (especially the "nothing else decodes this code" line)
  to register what just happened. Don't rush them.
- **Don't read the [CUE: ...] lines.** Those are screen-direction
  for matching your voice to the on-screen action.

## Two recording approaches

**Approach A — record voice over the existing terminal mp4:**
1. Open `web/demo-e2e.mp4` (or `docs/pitch.mp4`) in any video editor.
2. Mute the original audio (the e2e mp4 is silent anyway).
3. Record voiceover reading this script while playing the video.
4. Export. Done.

**Approach B — record screen + voice together:**
1. Open OBS or any screen recorder.
2. Run `record_demo.sh` (or just run the 14 commands manually in WSL).
3. Read this script live while commands execute.
4. Export.

Approach A is easier (the terminal pacing is already baked into the
mp4). Approach B sounds more natural (one continuous recording, no
edit seam).

If you go with Approach B, the script's [CUE: ...] lines are the
commands you actually type. Pace yourself — wait for the previous
command's output to finish rendering before starting the next sentence.
