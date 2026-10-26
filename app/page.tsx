import Link from "next/link";
export default function Home() {
  return (
    <main className="shell">
      <section className="landing">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> Local encryption. Open source.
          </div>
          <h1>
            Private files.
            <br />
            <em>Familiar images.</em>
          </h1>
          <p>
            Turn a document into an encrypted image carrier. Keep the password
            separate. Let the right person open it.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/studio">
              Protect a file ↗
            </Link>
            <Link className="btn" href="/help">
              See how it works
            </Link>
          </div>
          <div className="trustline">
            No account for Studio <span>·</span> Your own image <span>·</span>{" "}
            Your own password
          </div>
        </div>
        <div
          className="product-visual"
          aria-label="Illustration of a document encrypted inside an image"
        >
          <div className="visual-top">
            <span>YOUR DEVICE</span>
            <span className="success">● Local processing</span>
          </div>
          <div className="paper">
            <span>▤</span>
            <div>
              project-notes.pdf<small>Your original document</small>
            </div>
            <b>01</b>
          </div>
          <div className="visual-arrow">
            ↓ &nbsp; Encrypt with your password
          </div>
          <div className="image-demo">
            <div className="sun" />
            <div className="ridge one" />
            <div className="ridge two" />
            <span className="image-badge">ENCRYPTED PAYLOAD INSIDE</span>
          </div>
          <div className="visual-bottom">
            <strong>your-cover.veildrop.png</strong>
            <span>Ready to send as a file ↗</span>
          </div>
          <div className="small">
            Illustration only — choose any supported cover in Studio.
          </div>
        </div>
      </section>
      <section className="value-strip">
        <span>01 / CHOOSE A DOCUMENT</span>
        <span>02 / ADD YOUR COVER</span>
        <span>03 / SET A PASSWORD</span>
        <span>04 / SEND THE ORIGINAL</span>
      </section>
      <section className="section-heading">
        <div className="eyebrow">Two ways to protect a file</div>
        <h2>Stay local. Or add access controls.</h2>
      </section>
      <section className="docgrid">
        <article className="panel mode-card">
          <div className="eyebrow">Local Studio / Free</div>
          <h2>A file and a password.</h2>
          <p className="muted">
            Encrypt and recover in your browser. No account, no document upload,
            no subscription.
          </p>
          <Link className="text-link" href="/studio">
            Open Studio →
          </Link>
        </article>
        <article className="panel mode-card">
          <div className="eyebrow">Secure Share / Account required</div>
          <h2>Choose when access ends.</h2>
          <p className="muted">
            Set an expiry and manage future unlocks from your workspace. Send
            the image yourself; VeilDrop handles online access.
          </p>
          <Link className="text-link" href="/secure-share">
            Create a share →
          </Link>
        </article>
      </section>
      <section className="callout">
        <p>
          Encryption protects the contents. The image does not make the payload
          undetectable. Send the original file: screenshots and photo
          compression may remove it.
        </p>
        <Link href="/security">Understand the limits →</Link>
      </section>
    </main>
  );
}
