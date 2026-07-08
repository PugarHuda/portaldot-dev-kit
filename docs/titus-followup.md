# Follow-up DM to Titus — full α.1 → α.4 progress digest

Send after posting the α.3 progress tweet. Compact, links to
artifacts, closes on next-action.

---

## DM text

```
Hey Titus 👋 quick update on PDK since the launch tweet.

Two days ago we shipped v0.2 alpha.1 — a TypeScript companion CLI at github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang/tree/master/pdk-ts.

Since then, three alphas total:
→ α.1 : doctor · accounts · version (real @polkadot/api chain queries)
→ α.2 : pallets · storage · keys (full read-only surface)
→ α.3 : explain — the hero raw-code decoder — with an offline fast path via a Portaldot-1002 verified error index (no node required for the fast case)

Seven of the fourteen commands on the TS side now. Verified in CI against Polkadot mainnet RPC end-to-end. Signing tier (simulate/send/seed) lands in α.4 next — full design at docs/alpha4-signing-design.md.

At current velocity, beta.1 (feature parity) should land within 2 weeks.

Would love your feedback on:
1. Timeline — does the α.4-through-beta.1 pace line up with what Portaldot needs?
2. Discord — should we spin up a #pdk channel inside the official Portaldot Discord for KB PRs + support?
3. Testnet — when a Portaldot testnet endpoint is ready, pdk-ts is one-flag-swap ready (--node wss://…).

Repo: github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang
Latest tweet: [X link]
🙏
```

---

## Shorter variant (if Titus prefers punchy DMs)

```
Hey Titus — quick PDK update.

3 alphas in 2 days. 7/14 commands on the TS side. Hero explain command shipped with an offline fast path.

Signing tier next (α.4). At this pace beta.1 in ~2 weeks.

Design + CI + tests all green. See github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang/tree/master/pdk-ts + latest tweet.

Open questions in the follow-up doc; happy to jump on a call whenever 🙏
```

---

## Open questions to raise if Titus responds

- Discord `#pdk` channel — go / no go?
- Grant program — is there one to apply to?
- Testnet endpoint access — timeline?
- Would Portaldot dev docs accept a PR from us adding pdk-ts under
  the SDK Extension section?
