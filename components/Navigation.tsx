import Link from "next/link";
export default function Navigation() {
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="topbar">
        <Link className="wordmark" href="/">
          <span className="mark">V</span> VeilDrop <small>BETA</small>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/studio">Studio</Link>
          <Link href="/secure-share">Share</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/help">How it works</Link>
          <Link className="nav-cta" href="/dashboard">
            My workspace ↗
          </Link>
        </nav>
      </header>
    </>
  );
}
