# Community posts — ready to paste

Helpful-first drafts for the Portaldot hackathon Q&A / Discord. The goal is to
*answer the real question first*, then mention pdk as the shortcut. Don't spam —
post these where they genuinely answer someone.

---

## A. Reply to "How do I get POT?" / "Where's the faucet?"

> On a local `--dev` node you don't need a faucet — the dev accounts (Alice, Bob,
> Charlie) are already funded at genesis. To see their addresses and balances in
> one command:
>
> ```bash
> pip install portaldot-pdk
> pdk accounts
> ```
>
> That prints each dev account's address + POT balance. Use `//Alice` etc. as the
> signing URI. (I built `pdk` to smooth out exactly these first-hour questions —
> repo: https://github.com/PugarHuda/portaldot-pdk)

---

## B. Reply to "My transaction failed with `Module error: 0x06…` — what does that mean?"

> That raw code is a pallet error index — the node doesn't spell it out. You can
> decode it against the runtime's own metadata. Easiest way:
>
> ```bash
> pdk debug <txhash>
> ```
>
> It reads the `ExtrinsicFailed` event, resolves the error name from metadata, and
> prints what happened + how to fix it. There's also a no-install error reference
> if you just want to look the error up:
> https://portaldot-pdk.vercel.app/errors
>
> (`0x0600…` is usually `Balances.InsufficientBalance`, for what it's worth.)

---

## C. Show-and-tell / launch post (hackathon channel)

> **pdk — Portaldot Dev Kit** 🛠️
>
> Building on Portaldot, the friction that kept biting me was the first hour:
> getting POT, and decoding cryptic transaction failures. So I made a CLI that
> owns the local dev loop end-to-end — 13 commands, all talking to a real node.
>
> The hero is **FailLens** (`pdk debug`): it turns `Module error: 0x06…` into a
> plain-language diagnosis + fix, decoded against the chain's own metadata (so it
> never goes stale). There's also a zero-install error reference in the browser.
>
> - Install: `pip install portaldot-pdk`
> - Code (MIT): https://github.com/PugarHuda/portaldot-pdk
> - Error reference: https://portaldot-pdk.vercel.app/errors
> - 1-min demo: <YouTube link>
>
> Feedback very welcome — and if you hit an error that isn't well explained, the
> knowledge base is a five-line PR away. 🙏

---

## D. One-line replies (for quick threads)

- *"how do I start a node?"* → `pdk up` brings a local node up and proves it with a real tx. https://github.com/PugarHuda/portaldot-pdk
- *"is there an error list anywhere?"* → Yes, searchable + no install: https://portaldot-pdk.vercel.app/errors
- *"how do I check a balance / read storage?"* → `pdk storage Balances TotalIssuance`, or `pdk accounts` for the dev accounts.

> **Etiquette:** lead with the answer, keep the link secondary, and only post where
> it actually helps. One genuinely useful reply beats ten promos.
