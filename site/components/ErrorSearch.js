"use client";
import { useMemo, useState } from "react";
import { ERRORS, splitCode } from "../lib/errors";

function Rich({ text }) {
  return splitCode(text).map((seg, i) =>
    seg.code ? (
      <span key={i} className="mono" style={{ color: "#fff" }}>{seg.text}</span>
    ) : (
      <span key={i}>{seg.text}</span>
    )
  );
}

export default function ErrorSearch() {
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return ERRORS;
    return ERRORS.filter(
      (e) =>
        (e.p + "." + e.n).toLowerCase().includes(query) ||
        e.s.toLowerCase().includes(query) ||
        e.f.join(" ").toLowerCase().includes(query)
    );
  }, [q]);

  return (
    <>
      <div className="e-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9d1d9" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Search errors — e.g. InsufficientBalance, gas, origin, frozen…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search Portaldot errors"
          autoFocus
        />
      </div>
      <div className="e-count">
        {items.length === ERRORS.length
          ? `${ERRORS.length} errors · all verified against the live runtime`
          : `${items.length} of ${ERRORS.length} errors`}
      </div>

      {items.length === 0 ? (
        <div className="e-empty">
          No error matches that search. Try a pallet name (balances, contracts, assets…) or a keyword.
        </div>
      ) : (
        items.map((e) => (
          <article className="e-card" key={e.p + "." + e.n}>
            <h2>
              <span className="badge">{e.p}</span>
              <span className="e-name">{e.n}</span>
            </h2>
            <p className="e-summary"><Rich text={e.s} /></p>
            <div className="fix-label">How to fix</div>
            <ol className="fix">
              {e.f.map((s, i) => (
                <li key={i}><Rich text={s} /></li>
              ))}
            </ol>
          </article>
        ))
      )}
    </>
  );
}
