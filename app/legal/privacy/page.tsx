import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="shell">
      <section className="hero compact">
        <div className="eyebrow">Privacy notice</div>
        <h1>Privacy by architecture.</h1>
        <p>
          This is a technical product notice and is not a substitute for
          jurisdiction-specific legal advice.
        </p>
      </section>
      <section className="panel" style={{ marginTop: 32 }}>
        <h2>Local Studio</h2>
        <p className="muted">
          Local Studio processes the selected document and carrier in the
          browser. The application does not need to upload the plaintext
          document to VeilDrop.
        </p>
        <h2>Secure Share</h2>
        <p className="muted">
          Secure Share sends authentication and share-control data to the hosted
          service. The plaintext document and carrier are encrypted/assembled in
          the browser before the share is created. The service stores an OPAQUE
          registration record, wrapped file-key material, share metadata,
          rate-limit state and security audit events.
        </p>
        <h2>Billing</h2>
        <p className="muted">
          Payments are processed by Paddle. VeilDrop should only retain the
          billing information required to provision the purchased service.
        </p>
        <h2>Retention</h2>
        <p className="muted">
          Configure and publish a precise retention schedule before commercial
          launch. The repository intentionally does not invent a legal retention
          period for your business.
        </p>
      </section>
      <footer className="footer">
        Replace this technical notice with a reviewed legal privacy policy
        before live commercial use. Copyright © 2026 Md Taufiqur Rahman.
      </footer>
    </main>
  );
}
