// Shared sticky top bar for the dashboard and errors pages.
export default function TopBar({ status }) {
  return (
    <header className="topbar">
      <div className="wrap-wide row">
        <a className="brand" href="/" style={{ textDecoration: "none" }}>
          pdk<span className="dot">.</span>
        </a>
        <nav className="navlinks">
          <a href="/">Home</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/errors">Errors</a>
          <a href="/slide">Pitch</a>
          <a href="https://portalscan.portaldot.io">Explorer ↗</a>
          <a href="https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang">GitHub ↗</a>
        </nav>
        {status ? (
          <span className="status">
            <span className="pulse" /> {status}
          </span>
        ) : null}
      </div>
    </header>
  );
}
