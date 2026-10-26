import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="shell">
      <section className="hero compact">
        <div className="eyebrow">Terms</div>
        <h1>Service terms placeholder.</h1>
        <p>
          This page is a technical placeholder and must be replaced with terms
          reviewed for the jurisdictions where you sell VeilDrop.
        </p>
      </section>
      <section className="panel" style={{ marginTop: 32 }}>
        <h2>Acceptable use</h2>
        <p className="muted">
          Users must not use VeilDrop for unlawful activity, unauthorized
          access, malware distribution, or infringement.
        </p>
        <h2>Security limitations</h2>
        <p className="muted">
          VeilDrop is not an absolute-security guarantee. Customers remain
          responsible for passwords, endpoint security, backups and lawful
          handling of their data.
        </p>
        <h2>Billing</h2>
        <p className="muted">
          Paid plans are billed according to the Paddle checkout terms and the
          final commercial policy published by the operator.
        </p>
      </section>
      <footer className="footer">
        Replace this placeholder with a reviewed legal agreement before
        accepting commercial customers. Copyright © 2026 Md Taufiqur Rahman.
      </footer>
    </main>
  );
}
