"use client";
import { useMemo, useState } from "react";
import { ERRORS, splitCode } from "../lib/errors";

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

export default function FailLens() {
  const [q, setQ] = useState("");

  const current = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return DEFAULT;
    return (
      ERRORS.find(
        (e) => (e.p + "." + e.n).toLowerCase().includes(query) || e.s.toLowerCase().includes(query)
      ) || DEFAULT
    );
  }, [q]);

  const pallet = current.p.charAt(0).toUpperCase() + current.p.slice(1);

  return (
    <>
      <input
        className="fl-input"
        type="search"
        placeholder="Type an error — e.g. InsufficientBalance, OutOfGas, BadOrigin…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search Portaldot errors"
      />
      <div className="chips">
        {QUICK.map((name) => (
          <span
            key={name}
            className={`chip ${current.n === name ? "active" : ""}`}
            onClick={() => setQ(name)}
          >
            {name}
          </span>
        ))}
      </div>
      <div className="dterm">
        <div><span className="mut">raw: ExtrinsicFailed · DispatchError {"{ Module }"}</span></div>
        <div style={{ marginTop: 8 }}><span className="err">✗ {pallet}.{current.n}</span></div>
        <div className="lbl">What happened</div>
        <div><Rich text={current.s} /></div>
        <div className="lbl">How to fix</div>
        <ol className="fix">
          {current.f.map((step, i) => (
            <li key={i}><Rich text={step} /></li>
          ))}
        </ol>
      </div>
    </>
  );
}
