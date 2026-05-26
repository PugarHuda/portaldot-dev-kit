import TopBar from "../../components/TopBar";
import Reveal from "../../components/Reveal";
import FailLens from "../../components/FailLens";

export const metadata = {
  title: "pdk — Developer Dashboard",
  description:
    "A visual companion to the pdk CLI — node health, an interactive FailLens decoder, dev accounts, and the full command surface for Portaldot.",
  openGraph: {
    title: "pdk — Portaldot Developer Dashboard",
    description: "Node health, a live in-browser FailLens decoder, dev accounts, and 12 commands.",
    url: "https://portaldot-pdk.vercel.app/dashboard",
    images: ["/logo.png"],
  },
};

const ACCOUNTS = [
  ["Alice", "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"],
  ["Bob", "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"],
  ["Charlie", "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y"],
];
const COMMANDS = [
  ["pdk up", "Start a node + verify with a real tx"],
  ["pdk accounts", "Funded dev accounts + POT"],
  ["pdk debug", "FailLens — decode a failure"],
  ["pdk explain", "Queryable error reference"],
  ["pdk doctor", "Node + ink! + liveness"],
  ["pdk simulate", "Preview fee + feasibility"],
  ["pdk seed", "Fund accounts from fixtures"],
  ["pdk pallets", "Browse pallets / calls / errors"],
  ["pdk send", "A real POT transfer"],
  ["pdk storage", "Read any chain storage"],
  ["pdk watch", "Stream chain events live"],
  ["pdk keys", "Generate / inspect a keypair"],
];

export default function Dashboard() {
  return (
    <>
      <TopBar status="Development · portaldot-1002" />
      <main className="wrap-wide">
        <section className="d-hero">
          <div className="kicker">Portaldot · developer dashboard</div>
          <h1>Everything pdk surfaces — at a glance.</h1>
          <p className="d-lede">
            pdk is a 12-command CLI for the Portaldot local dev loop. This dashboard is its visual
            companion: the node&apos;s health, a live <span className="mono">FailLens</span> decoder you can
            actually use, the funded dev accounts, and the full command surface.
          </p>
          <div className="note">
            <strong>No mocks.</strong> Every value here is real: the runtime facts and dev-account
            addresses pdk reads from a live Portaldot node, the verified error knowledge base, and the
            actual native-deployment transaction hash. Run the commands yourself to reproduce any of it.
          </div>
        </section>

        <section className="grid">
          <Reveal className="d-card col-4">
            <h2>Node health <span className="cmd">pdk doctor</span></h2>
            <div className="kv"><span className="k">Chain</span><span className="v">Development</span></div>
            <div className="kv"><span className="k">Runtime</span><span className="v">portaldot-1002</span></div>
            <div className="kv"><span className="k">Node</span><span className="v">portaldot_dev 2.0.0</span></div>
            <div className="kv"><span className="k">Block time</span><span className="v">6s</span></div>
            <div className="kv"><span className="k">Contracts API</span><span className="v">v5 <span className="amber">(ink! 3.x)</span></span></div>
            <div className="kv"><span className="k">Liveness</span><span className="v"><span className="ok">● producing blocks</span></span></div>
            <div className="kv"><span className="k">Explorer</span><span className="v"><a href="https://portalscan.portaldot.io">portalscan ↗</a></span></div>
          </Reveal>

          <Reveal className="d-card col-8">
            <h2>FailLens — decode any failure, live <span className="cmd">pdk debug</span></h2>
            <FailLens />
            <div style={{ marginTop: 12, color: "var(--muted)", fontSize: "13.5px" }}>
              Decoded against the chain&apos;s own metadata — <strong style={{ color: "var(--text)" }}>try any of the{" "}
              <a href="/errors">29 verified errors</a></strong>. This runs the real knowledge base, in your browser.
            </div>
          </Reveal>

          <Reveal className="d-card col-6">
            <h2>Dev accounts <span className="cmd">pdk accounts</span></h2>
            {ACCOUNTS.map(([name, addr]) => (
              <div className="acct" key={name}>
                <span className="name">{name}</span>
                <span className="addr">{addr}</span>
                <span className="badge">genesis</span>
              </div>
            ))}
            <div style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
              Funded at genesis on a <span className="mono">--dev</span> chain · SS58 format 42 · POT has 14 decimals.
              The one-command answer to <em>&quot;how do I get POT?&quot;</em>. Run <span className="mono">pdk accounts</span> for live balances.
            </div>
          </Reveal>

          <Reveal className="d-card col-6">
            <h2>Native deployment proof <span className="cmd">pdk up</span></h2>
            <div className="proof">
              <div className="kv"><span className="k">tx hash</span></div>
              <div className="hash">0x8b605579d6b512892f4394aa43937e1d762d34411b43c6a4aa9fa8a5dd4d546a</div>
              <div className="kv" style={{ marginTop: 8 }}><span className="k">node</span><span className="v">local Portaldot dev (2.0.0)</span></div>
              <div className="kv"><span className="k">fee</span><span className="v"><span className="ok">paid in POT</span></span></div>
            </div>
            <div style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
              A real on-chain transaction paying POT as gas — the hackathon&apos;s native-deployment requirement.
            </div>
          </Reveal>

          <Reveal className="d-card col-12">
            <h2>The command surface <span className="cmd">12 commands</span></h2>
            <div className="cmds">
              {COMMANDS.map(([c, d]) => (
                <div className="cmd-card" key={c}>
                  <div className="c">{c}</div>
                  <div className="d">{d}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, color: "var(--muted)", fontSize: "13.5px" }}>
              <span className="mono">pip install portaldot-pdk</span> · runs on Linux, macOS &amp; Windows ·
              CI-gating with <span className="mono">pdk debug --json --exit-code</span>.
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="site-foot">
        <div className="wrap-wide row">
          <span>pdk — Portaldot Dev Kit · a visual companion to the CLI · verified against runtime <span className="mono">portaldot-1002</span></span>
          <span><a href="https://github.com/PugarHuda/portaldot-pdk">github.com/PugarHuda/portaldot-pdk</a></span>
        </div>
      </footer>
    </>
  );
}
