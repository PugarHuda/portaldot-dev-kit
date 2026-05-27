"use client";
import { useMemo, useState } from "react";
import { ERRORS, splitCode } from "../lib/errors";
import INDEX from "../lib/errorIndex.json";

const QUICK = ["InsufficientBalance", "OutOfGas", "BadOrigin", "ContractTrapped", "Frozen"];
const DEFAULT = ERRORS.find((e) => e.n === "InsufficientBalance") || ERRORS[0];

function Rich({ text }) {
  return splitCode(text).map((seg, i) =>
    seg.code ? (
      <span key={i} className="mono" style={{ color: "#fff" }}>{seg.text}</span>
    ) : (
      <span key={i}>{seg.text}</span>
    )
  );
}

// Pull a raw [module, error] code out of free text — handles
// "Module: { index: 6, error: 2 }", "6 2", "6,2", "6.2", "6/6".
function parseCode(q) {
  const a = q.match(/index\s*:?\s*(\d+)[^\d]+error\s*:?\s*(\d+)/i);
  if (a) return [Number(a[1]), Number(a[2])];
  const b = q.match(/^\s*(\d+)\s*[\s,./-]\s*(\d+)\s*$/);
  if (b) return [Number(b[1]), Number(b[2])];
  return null;
}

function resolveCode([m, e]) {
  const label = `Module { index: ${m}, error: ${e} }`;
  const name = INDEX[`${m}.${e}`];
  if (!name) return { error: null, note: `${label} → not in the verified portaldot-1002 index.` };
  const [pal, nm] = name.split(".");
  const curated = ERRORS.find((x) => x.n === nm && x.p.toLowerCase() === pal.toLowerCase());
  if (curated) return { error: curated, note: `${label} → ${name}` };
  return {
    error: {
      p: pal.toLowerCase(),
      n: nm,
      s: "Decoded from the verified runtime index — no curated fix yet.",
      f: [
        "Check the call's inputs, the signer's balance, and permissions.",
        "Inspect on-chain state via the Portaldot explorer (portalscan.portaldot.io).",
      ],
    },
    note: `${label} → ${name}`,
  };
}

export default function FailLens() {
  const [q, setQ] = useState("");

  const { current, note } = useMemo(() => {
    const query = q.trim();
    if (!query) return { current: DEFAULT, note: null };
    const code = parseCode(query);
    if (code) {
      const r = resolveCode(code);
      return { current: r.error, note: r.note };
    }
    const lc = query.toLowerCase();
    const found =
      ERRORS.find(
        (e) => (e.p + "." + e.n).toLowerCase().includes(lc) || e.s.toLowerCase().includes(lc)
      ) || DEFAULT;
    return { current: found, note: null };
  }, [q]);

  const pallet = current ? current.p.charAt(0).toUpperCase() + current.p.slice(1) : "";

  return (
    <>
      <input
        className="fl-input"
        type="search"
        placeholder="Type a name (InsufficientBalance) or paste a raw code (6 2 · index: 6, error: 2)…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Decode a Portaldot error by name or raw code"
      />
      <div className="chips">
        {QUICK.map((name) => (
          <span
            key={name}
            className={`chip ${current && current.n === name && !note ? "active" : ""}`}
            onClick={() => setQ(name)}
          >
            {name}
          </span>
        ))}
        <span className="chip" onClick={() => setQ("index: 6, error: 2")}>raw&nbsp;6·2</span>
      </div>
      <div className="dterm">
        <div>
          <span className="mut">{note || "raw: ExtrinsicFailed · DispatchError { Module }"}</span>
        </div>
        {current ? (
          <>
            <div style={{ marginTop: 8 }}><span className="err">✗ {pallet}.{current.n}</span></div>
            <div className="lbl">What happened</div>
            <div><Rich text={current.s} /></div>
            <div className="lbl">How to fix</div>
            <ol className="fix">
              {current.f.map((step, i) => (
                <li key={i}><Rich text={step} /></li>
              ))}
            </ol>
          </>
        ) : (
          <div style={{ marginTop: 8, color: "var(--muted)" }}>
            No match — check the module / error numbers.
          </div>
        )}
      </div>
    </>
  );
}
