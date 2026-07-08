# Titus FAQ — prepared answers for likely questions

Not exhaustive. Covers the questions most likely to come up in
partnership DMs, panel calls, or Discord threads. Each answer is
short + factual + linked to an artifact when relevant.

---

## "What's the beta.1 timeline?"

Beta.1 = feature parity with Python `pdk` on the TypeScript side.
Given actual velocity (7 commands in 2 days across α.1 → α.3), and
that α.4 signing tier is the heaviest remaining alpha:

- **α.4 (signing):** 2-3 days after design freeze
  ([design here](alpha4-signing-design.md))
- **α.5 (debug/report/watch/ai-setup):** 2 days after α.4
- **beta.1 (parity):** ~1 week after α.5

Realistic ship target: **beta.1 within 2 weeks** at current cadence.
0.2.0 stable ships to npm after 1 week of beta stability.

---

## "How does pdk-ts differ from PAPI?"

PAPI (Polkadot-API) is a low-level SDK — a modern light-client-first
alternative to `@polkadot/api`. **pdk-ts is not a competitor.** It
sits on top: pdk-ts uses `@polkadot/api` today, will benchmark
against PAPI at α.6, and adopts whichever wins the metadata-fetch +
tx-submit + bundle-size tests.

What PAPI does not ship:
- The 14-command CLI surface
- The metadata-driven error decoder (FailLens)
- The community knowledge base for fix steps
- Portaldot-specific integrations

PAPI is a library. PDK is a builder tool that uses libraries.

---

## "Have you tested against Portaldot mainnet?"

Mainnet is not live yet — per Portaldot team's own communication,
"project support resources after the POT mainnet launch". Everything
today is tested against:

- Local Portaldot dev node (both CLIs)
- Public Polkadot RPC (`wss://rpc.polkadot.io`, pdk-ts CI integration)

The mainnet-ready v1.0 milestone is scheduled to align with Portaldot's
own launch. pdk-ts is already one-flag-ready — `--node
wss://<portaldot-mainnet-rpc>` and it just works.

---

## "Why TypeScript in addition to Python?"

The Python `substrate-interface` library mis-signs custom-pallet
calls on Portaldot's V13 metadata (upstream bug I diagnosed
mid-hackathon and filed as [polkascan/py-substrate-interface#9](https://github.com/polkascan/py-substrate-interface/issues/9)).

Even if fixed upstream, Python remains a second-class citizen on V13
metadata — new pallets in future runtime upgrades will break signing
again. TypeScript via `@polkadot/api` (soon PAPI) is the ecosystem's
first-class path for signing + full runtime coverage.

Python still ships. pdk-ts covers what Python cannot.

---

## "How big is the community?"

Solo maintainer today (Pugar Huda Mantoro). Contribution surface is
deliberately small (5-line YAML PRs for KB entries, standard PR
template for code). Growth plan:

- Alpha.4 → attract first external contributors via `good first issue`
- Beta.1 → invite 2-3 co-maintainers with merge rights
- Post-hackathon → move governance from BDFL to steering-council model
  (PEP 8016 pattern) once contributor base crosses ~20 active people.

Governance model documented in the partnership plan §7 and will be
codified in `GOVERNANCE.md` before v0.2.0 stable.

---

## "What support do you need from Portaldot?"

High priority:
1. **Recognition in official developer onboarding docs.** Being the
   recommended debugger means every new builder finds pdk in their
   first hour.
2. **Builder-channel access.** Direct line to core team announcements —
   runtime upgrades, new pallets, breaking changes.

Medium priority:
3. **Co-marketing on official X / Discord.** Retweets on milestone
   ships. Occasional Discord announcements for feature launches.

Optional (if a grant program exists):
4. **Grant support for v0.2 TypeScript SDK.** ~4 weeks of engineering.
5. **Early testnet endpoint access.** pdk is one-flag-ready.

Full detail in [`pdk-partnership-plan.md`](pdk-partnership-plan.md) §8.

---

## "What's the KB size?"

- **29 curated entries** in `pdk/data/error_fixes.yaml` today (verified
  against portaldot-1002 runtime metadata).
- **202 total error indices** mapped in `pdk/data/error_index.json`
  (used by the offline `explain` fast-path).
- Long tail resolves via metadata doc-comment fallback, so PDK is
  useful even for undocumented errors.

Growth target: **400+ curated entries** by v1.0.

---

## "Where's the KB stored? Can I contribute?"

`pdk/data/error_fixes.yaml`. Schema versioned (v1) in the file header.
Contribution flow:

1. Open [KB issue template](https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang/issues/new?template=kb_entry.md)
   OR
2. PR directly — one entry is 5 lines of YAML

Both `pdk` (Python) and `pdk-ts` (TypeScript) read the same file. One
PR benefits both CLIs.

---

## "What happens on runtime upgrade?"

Nothing breaks. PDK reads runtime metadata at every invocation, so
the moment Portaldot upgrades:

- New pallet appears in `pdk pallets` output automatically
- New errors resolve via metadata even before KB entries exist
- Existing KB entries still match because keys are
  `<pallet>.<ErrorName>`, both derived from the live metadata

The offline `error_index.json` fast-path is regenerated per Portaldot
runtime version — `extract_index.py` reads live metadata and writes
the JSON. Runs in CI on runtime bump.

---

## "How do I install pdk-ts?"

Not on npm yet — alpha phase, expected 0.2.0 stable to ship as
`portaldot-pdk-ts` on npm within 2 weeks.

Today:
```bash
git clone https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang.git
cd portaldot-hackathon-2026-pdk-AmpunBang/pdk-ts
npm install
npm run build
node dist/index.js version
```

Python side ships today: `pip install portaldot-pdk`.
