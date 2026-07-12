import TopBar from "../../components/TopBar";
import ErrorSearch from "../../components/ErrorSearch";

export const metadata = {
  title: "Portaldot Error Reference — pdk",
  description:
    "What every Portaldot transaction error means and how to fix it. The verified knowledge base behind pdk's FailLens — searchable, no install required.",
  openGraph: {
    title: "Portaldot Error Reference — pdk",
    description: "What every Portaldot transaction error means and how to fix it. No install required.",
    url: "https://portaldot-pdk.vercel.app/errors",
    images: ["/logo.png"],
  },
};

export default function ErrorsPage() {
  return (
    <>
      <TopBar />
      <main className="wrap">
        <section className="e-hero">
          <div className="kicker">Portaldot · error reference</div>
          <h1 className="big-h1">Every Portaldot error, explained.</h1>
          <p className="d-lede">
            When a Portaldot transaction fails, the node returns a raw code like{" "}
            <span className="mono">Module error: 0x0600…</span> — no message. This is the verified
            knowledge base behind pdk&apos;s <span className="mono">FailLens</span>: what each error means
            and how to fix it. <strong style={{ color: "#fff" }}>No install required</strong> — search below.
          </p>
          <div className="note">
            Want the same answers in your terminal, live against your own failed transactions?{" "}
            <span className="mono">pip install portaldot-pdk</span> → <span className="mono">pdk debug &lt;txhash&gt;</span>.
            Spot a missing or better fix? Every entry is community-owned —{" "}
            <a href="https://github.com/PugarHuda/portaldot-dev-kit/blob/master/CONTRIBUTING.md">add one in a five-line PR</a>.
          </div>
        </section>

        <section style={{ paddingBottom: 40 }}>
          <ErrorSearch />
        </section>
      </main>

      <footer className="site-foot">
        <div className="wrap row">
          <span>pdk — Portaldot Dev Kit · verified against runtime <span className="mono">portaldot-1002</span></span>
          <span><a href="https://github.com/PugarHuda/portaldot-dev-kit">github.com/PugarHuda/portaldot-dev-kit</a></span>
        </div>
      </footer>
    </>
  );
}
