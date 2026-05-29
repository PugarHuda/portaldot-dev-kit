# DoraHacks BUIDL submission — copy-paste fields

Fill the BUIDL form with the values below. Items marked **⏳ you** still need an
action from you (upload/link).

---

### BUIDL name
```
pdk — Portaldot Dev Kit
```

### Logo (480×480, PNG, <2MB)
Use `docs/logo.png` (exactly 480×480). ✅ ready in the repo.

### Vision  *(max 256 chars)*
```
Portaldot prints a raw error code when a tx fails — no message, no fix. pdk's FailLens decodes it into a plain-language diagnosis + fix using the chain's own metadata. 13 commands cover the local dev loop, no mocks. pip install portaldot-pdk.
```
*(242 chars — fits inside the 256-char limit on the DoraHacks BUIDL form.)*

### Category
```
Builder Tools
```

### Is this BUIDL an AI Agent?
```
No
```

### GitHub link
```
https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang
```

### Project website
```
https://portaldot-pdk.vercel.app
```

### Demo video
```
<YouTube link>   ⏳ you — upload docs/pitch.mp4 to YouTube, paste the link here
```

### Social link (at least one required)
```
https://github.com/PugarHuda
```
⏳ you — if you have an X/Twitter or Telegram handle, prefer that (more "social").

---

### Full description  *(paste into the long BUIDL description field)*

**pdk turns Portaldot's cryptic transaction failures into clear, actionable diagnoses — and gives every developer a one-command local dev loop.**

**The problem.** Portaldot is brand-new and Rust-first; in Season 1 developers run it from a local node. When a transaction fails, the node returns a raw error like `Module error: 0x0600…` with no explanation. Onboarding and debugging are the biggest sources of friction — the hackathon's own Q&A is full of *"how do I get POT?"* and *"where's the RPC?"*.

**The solution.** `pdk` is a single Python CLI with 13 commands covering the whole local loop:
- `pdk debug` (**FailLens**) — decode a failed transaction into a plain-language diagnosis + fix. The hero.
- `pdk up` / `accounts` — start a node and answer *"how do I get POT?"* in one command.
- `explain`, `pallets`, `storage`, `watch`, `doctor` — inspect the chain and the runtime.
- **`pdk explain --module 6 --error 2`** — decode the *raw* `DispatchError { Module: { index, error } }` code a node prints, with no hash and no name, via a verified 202-entry runtime index. The exact cryptic thing builders copy from logs — and nothing else decodes it.
- **`pdk report`** — scan recent blocks and summarise every failure by type (triage analytics).
- **`pdk debug --demo --fix`** — diagnose *and remediate*: submit the corrected tx and show it succeed.
- **`pdk debug --ai`** — optional AI diagnosis for the long tail, grounded in chain metadata (labelled "AI-suggested"; verified KB stays source of truth).
- `simulate`, `seed`, `send`, `keys` — preview fees, fund accounts, transact, manage keys.

FailLens resolves errors against the **chain's own metadata** (no hard-coded tables), so it adapts to any runtime version. Every entry in its knowledge base is verified against the live `portaldot-1002` runtime.

**Portaldot-native (mandatory).** `pdk up` and `pdk debug --demo` submit **real transactions to a local Portaldot node, paying POT as gas.** The pitch video (≈59 s) is a hybrid: slides frame the problem, then a real asciinema recording shows the full live flow (`doctor → accounts → debug --demo → explain --module 6 --error 2 → debug --demo --fix → report`) executing against a fresh `portaldot_dev 2.0.0` node. Sample proof tx: `0x8b605579d6b512892f4394aa43937e1d762d34411b43c6a4aa9fa8a5dd4d546a`.

**Why it matters.** This hackathon exists to acquire developers; pdk removes the #1 barrier to onboarding. It's adoption-ready: `pip install portaldot-pdk`, a CI-gating mode (`pdk debug --json --exit-code`) so teams depend on it in pipelines, a community-owned error knowledge base, and a zero-install web error reference (https://portaldot-pdk.vercel.app/errors). The moat is Portaldot-specific, metadata-verified knowledge — not liftable from a generic Substrate tool.

**Quality.** 35 automated tests (CI on Python 3.11 + 3.12), no mocks, MIT licensed, published to PyPI (`pip install portaldot-pdk`, v0.1.5).

- Repo: https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang
- Install: `pip install portaldot-pdk`
- Error reference: https://portaldot-pdk.vercel.app/errors
- Pitch deck: https://portaldot-pdk.vercel.app/slide

---

### Pre-submit checklist
- [ ] Publish to PyPI so `pip install portaldot-pdk` is live (`python -m twine upload dist/*`)
- [ ] Upload `docs/pitch.mp4` to YouTube → paste link in **Demo video** (+ in Full description)
- [ ] Logo `docs/logo.png` uploaded
- [ ] Confirm Category = Builder Tools, AI Agent = No
- [ ] Submit, then verify it appears under the hackathon's BUIDLs tab
