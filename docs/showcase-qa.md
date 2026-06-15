# Showcase Q&A — short, honest answers for the panel

Read each as a 20–40 second answer. Don't over-prepare phrasing —
audiences hear sincerity, not polish. The story beats are concrete
(filed issue, two-hour spike, repo rename) so they're verifiable, not
brag-able.

---

## 1. What was the biggest challenge during the hackathon?

The `substrate-interface` Python library mis-signs custom-pallet calls
on Portaldot's V13 metadata. I discovered it the hard way when extending
pdk to the Assets pallet — every signed transaction got rejected. Half a
day of debugging, then I filed the upstream issue
[polkascan/py-substrate-interface#9](https://github.com/polkascan/py-substrate-interface/issues/9).
The takeaway was bigger than the bug: Python builders are second-class
citizens on Portaldot today. That's why a TypeScript companion SDK is
the first item in v0.2 — to cover the surface Python can't sign.

---

## 2. What was the most exciting moment while building?

Day one, two-hour spike. I walked the chain metadata manually, just
testing one assumption — that every error has a name on-chain. It did.
The instant I saw the raw `Module 6, error 2` code resolve
programmatically to `Balances.InsufficientBalance`, the entire product
clicked. I started writing the decoder that night. Every other command
came from that single proof.

---

## 3. Which PortalDOT feature, infrastructure, or ecosystem resource was most useful?

The runtime metadata. Portaldot inherits Substrate's type registry, and
that single design choice is what made FailLens possible. Without
metadata, every error decode would be hardcoded and would rot the first
runtime upgrade. With it, the decoder reads the chain's own truth —
202 error indices extracted live from `portaldot-1002`, regenerable
across upgrades. The explorer at `portalscan.portaldot.io` was the
cross-check that confirmed my decoded outputs matched what humans see
in the UI.

---

## 4. What feedback did you receive during the hackathon?

The most useful feedback was implicit. The Discord channel was full of
"how do I get POT?" — a question that already had an answer in the
runtime (pre-funded dev accounts), just not a discoverable answer.
That recurring pattern is what made me add `pdk accounts` as a
top-level command instead of burying it in docs. Direct mentor
feedback was limited since the hackathon ran async, but the upstream
maintainer engaging on issue #9 was real validation that the bug
diagnosis was correct.

---

## 5. If you had two more weeks, what would you improve first?

The TypeScript companion SDK. Python can't sign custom-pallet calls on
V13 metadata, which means pdk currently can't reach the Assets pallet
or deploy ink! contracts. A TS layer on `@polkadot/api` solves both —
same CLI, broader runtime coverage. Three weeks of focused work,
designed to ship as `pdk-ts` alongside the existing Python core, so
no breaking change for existing users. After that: editor extensions
that decode `Module {index, error}` codes inline in VS Code.

---

## 6. What kind of support does your project need next?

Three concrete things, in order of leverage:

1. **Recognition in official Portaldot developer onboarding** — being
   the recommended debugger means every new builder finds pdk in their
   first hour, not after they've hit five undecoded errors.
2. **A grant to fund v0.2** — the TypeScript SDK is roughly four weeks
   of focused engineering, more if we add editor extensions.
3. **Builder-channel access** to stay close to runtime upgrades — every
   new pallet means a new decoder entry, ideally written *before* the
   upgrade hits mainnet.

---

## 7. Are you planning to continue building this project after the hackathon?

Yes — and the infrastructure for it already exists. The release
pipeline auto-publishes to PyPI on every `v*` tag. CI runs on every
push. The QA harness covers 40 unit tests plus 84 integration and
stress checks. That's deliberate: pdk was built from day one to outlast
this hackathon. v0.2 (TypeScript SDK) is the next concrete milestone,
followed by community-owned `error_fixes.yaml` PRs and the editor
extensions.

---

## 8. What would help your project move from demo to real users?

Four things, roughly in order:

1. **A public Portaldot testnet RPC.** pdk is one-flag-ready —
   `--node wss://testnet.portaldot.io`. Right now every builder has to
   spin up a local node first, which is itself a barrier. Public RPC
   removes that entirely.
2. **The first five community PRs to `error_fixes.yaml`.** The
   knowledge base is structured so any Portaldot dev who hits a new
   error can submit a five-line YAML PR. The first five contributors
   create a network effect.
3. **Inclusion in the Portaldot docs.** Being the recommended tool in
   "your first transaction" tutorials means discoverability follows
   the official channel, not chance.
4. **Real-world friction.** Honestly, what pdk needs most is to be in
   the hands of people who *will* hit weird errors. Every undiagnosed
   error is a chance to expand the knowledge base — that's how it goes
   from "works for the cases I tested" to "works for the cases nobody
   thought to test."

---

## Producer notes

- **Be specific.** "Filed issue #9" beats "I worked on bugs". Numbers
  beat adjectives. The audience trusts concreteness.
- **Concede gracefully.** Q4 (feedback) — don't pretend mentor sessions
  happened that didn't. Say what was actually useful. Honesty lands.
- **One sentence per answer is fine.** Don't pad. If the panel wants
  more, they'll ask. Short answers leave room for follow-up — which
  is usually the more interesting question.
- **Connect every roadmap item to a *current* limitation.** Don't say
  "TS SDK is next" — say "TS SDK is next *because* Python can't sign
  Assets calls on V13 metadata". Audiences remember the *why*.
