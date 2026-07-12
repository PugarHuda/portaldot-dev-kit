import Reveal from "../components/Reveal";

const COMMANDS = [
  ["pdk up", "Start a local Portaldot node and verify it with a real on-chain transaction."],
  ["pdk accounts", 'Show the pre-funded dev accounts and their POT balances — the one-command answer to "how do I get POT?".'],
  ["pdk debug", "FailLens — decode any failed transaction into a plain-language diagnosis and fix. Add --watch for live, --json for CI."],
  ["pdk explain", "Look up what any Portaldot error means and how to fix it — a queryable reference, no transaction needed."],
  ["pdk doctor", "Check the node version, runtime, and ink! / contracts-API compatibility."],
  ["pdk simulate", "Preview a transfer's POT fee and feasibility — without sending it."],
  ["pdk seed", "Fund accounts from YAML fixtures so you start from realistic state."],
  ["pdk pallets", "Browse the runtime's pallets, calls, and errors — straight from metadata."],
  ["pdk send", "Send POT from a dev account — a real on-chain transfer."],
  ["pdk storage", "Read any value from the chain's storage, straight from the terminal."],
  ["pdk watch", "Stream every chain event live — a general monitoring view."],
  ["pdk keys", "Generate or inspect a keypair — no separate tool needed."],
  ["pdk report", "Scan recent blocks and summarise every failure by type — triage at a glance."],
];

export default function Home() {
  return (
    <>
      <header className="topbar">
        <div className="wrap row">
          <span className="brand">pdk<span className="dot">.</span></span>
          <nav className="navlinks">
            <a href="/dashboard">Dashboard</a>
            <a href="/errors">Error reference</a>
            <a href="/slide">Pitch deck</a>
            <a href="https://portalscan.portaldot.io">Explorer ↗</a>
            <a href="https://github.com/PugarHuda/portaldot-dev-kit">GitHub ↗</a>
          </nav>
        </div>
      </header>

      <section className="l-hero">
        <div className="wrap">
          <span className="tag">Portaldot Mini Hackathon S1 · Builder Tools</span>
          <h1>Portaldot Dev Kit<span className="dot">.</span></h1>
          <p className="lede">
            A command-line toolkit for the Portaldot blockchain. Its hero feature,{" "}
            <strong style={{ color: "var(--text)" }}>FailLens</strong>, turns cryptic
            transaction failures into clear, human-readable diagnoses — with fixes.
            <br />
            <span style={{ color: "var(--text)" }}>
              A starter kit helps you <em>write</em> Portaldot code; pdk is what <em>saves</em> you when it breaks.
            </span>
          </p>
          <div className="btns">
            <a className="btn primary" href="#install">Get started</a>
            <a className="btn" href="/dashboard">Open dashboard</a>
            <a className="btn" href="https://github.com/PugarHuda/portaldot-dev-kit">View source</a>
          </div>
        </div>
      </section>

      <Reveal as="section" className="sec">
        <div className="wrap">
          <div className="sec-kicker">The problem</div>
          <h3>Portaldot is new. Its errors are cruel.</h3>
          <p className="body">
            Portaldot is brand-new and Rust-first; in Season 1 you run it from a local node.
            When a transaction fails, the node hands back a raw, unexplained error code. No hint
            of what went wrong, no hint of how to fix it.
          </p>
          <div className="term">
            <div className="term-bar"><i /><i /><i /></div>
            <pre>
              <span className="c-muted"># a failed transaction on Portaldot, unfiltered</span>{"\n"}
              <span className="c-red">ExtrinsicFailed</span>: DispatchError <span className="c-muted">{"{ Module: { index: 6, error: 2 } }"}</span>{"\n"}
              <span className="c-muted"># ...now what?</span>
            </pre>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="sec">
        <div className="wrap">
          <div className="sec-kicker">FailLens</div>
          <h3>The same failure, decoded.</h3>
          <p className="body">
            FailLens reads the failed transaction&apos;s <span className="mono">ExtrinsicFailed</span> event,
            decodes the error against the chain&apos;s own metadata, and pairs it with a curated knowledge base of fixes.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/demo.gif"
            alt="pdk decoding a Portaldot transaction failure, live"
            style={{ width: "100%", maxWidth: 760, border: "1px solid var(--border)", borderRadius: 10, margin: "8px 0" }}
          />
          <div className="dterm" style={{ maxWidth: 760 }}>
            <div><span className="mut">$ pdk debug --demo</span></div>
            <div style={{ marginTop: 8 }}><span className="err">✗ Balances.InsufficientBalance</span></div>
            <div className="lbl">What happened</div>
            <div>You tried to transfer more POT than the sending account holds.</div>
            <div className="lbl">How to fix</div>
            <ol className="fix">
              <li>Check the sender balance.</li>
              <li>Lower the amount, or fund the account first with <span className="mono">pdk up</span>.</li>
            </ol>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="sec">
        <div className="wrap">
          <div className="sec-kicker">The toolkit · 13 commands</div>
          <div className="cards">
            {COMMANDS.map(([cmd, desc]) => (
              <div className="l-card" key={cmd}>
                <div className="cmd">{cmd}</div>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="sec" >
        <div className="wrap" id="install">
          <div className="sec-kicker">Install &amp; use</div>
          <h3>From zero to a decoded failure.</h3>
          <p className="body">
            Requires Python 3.11+. pdk runs natively on Linux, macOS <strong>and Windows</strong> —
            only the node binary is Linux/macOS (on Windows, run the node in WSL and connect pdk from PowerShell).
          </p>
          <div className="term">
            <div className="term-bar"><i /><i /><i /></div>
            <pre>
              <span className="c-green">$</span> pip install portaldot-pdk   <span className="c-muted"># one command, from PyPI</span>{"\n\n"}
              <span className="c-green">$</span> pdk up                  <span className="c-muted"># start a local node</span>{"\n"}
              <span className="c-green">$</span> pdk debug --demo        <span className="c-muted"># submit a failure, then decode it</span>{"\n"}
              <span className="c-green">$</span> pdk doctor              <span className="c-muted"># inspect the node</span>{"\n\n"}
              <span className="c-green">$</span> pdk debug 0x… --json --exit-code   <span className="c-muted"># gate CI on the result</span>
            </pre>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="sec">
        <div className="wrap">
          <div className="sec-kicker">How it works</div>
          <h3>Metadata-driven, so it never goes stale.</h3>
          <p className="body">
            A failed extrinsic emits a <span className="mono">System.ExtrinsicFailed</span> event carrying a{" "}
            <span className="mono">DispatchError</span>. FailLens resolves that error against the chain&apos;s own
            metadata — no hard-coded tables — so it adapts to any Portaldot runtime version. Every error in the
            knowledge base is verified against the live runtime.
          </p>
          <ol className="steps">
            <li>Locate the failed transaction (by hash, or submit one with <span className="mono">--demo</span>).</li>
            <li>Decode the <span className="mono">DispatchError</span> into a named error via metadata.</li>
            <li>Match it to a curated, human-written fix — with a graceful fallback for the long tail.</li>
          </ol>
        </div>
      </Reveal>

      <Reveal as="section" className="sec">
        <div className="wrap">
          <div className="sec-kicker">Roadmap</div>
          <h3>The standard Portaldot dev toolkit.</h3>
          <p className="body">
            On PyPI today. Next: a typed TypeScript SDK (to unlock ink! contract deploy), editor extensions,
            and deeper CI integrations — all under one CLI.
          </p>
        </div>
      </Reveal>

      <footer className="site-foot">
        <div className="wrap row">
          <span>pdk — Portaldot Dev Kit · MIT License</span>
          <span><a href="https://github.com/PugarHuda/portaldot-dev-kit">github.com/PugarHuda/portaldot-dev-kit</a></span>
        </div>
      </footer>
    </>
  );
}
