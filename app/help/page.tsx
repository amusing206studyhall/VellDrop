export default function Help() {
  return (
    <main className="shell">
      <section className="hero compact">
        <div className="eyebrow">A quick guide</div>
        <h1>
          From document
          <br />
          to image. And back.
        </h1>
        <p>
          Start with a small test document before sharing anything important.
        </p>
      </section>
      <section className="docgrid">
        <article className="panel">
          <h2>Send with Local Studio</h2>
          <ol>
            <li>Choose your PDF, document or other file.</li>
            <li>Select your own PNG, JPEG or WebP cover.</li>
            <li>
              Enter and confirm a unique password of at least 16 characters.
            </li>
            <li>Choose Encrypt & create carrier.</li>
            <li>
              Send the downloaded image as a file/document attachment. Send the
              password separately.
            </li>
          </ol>
        </article>
        <article className="panel">
          <h2>Recover the document</h2>
          <ol>
            <li>Open Studio → Reveal a local file.</li>
            <li>Select the exact original carrier.</li>
            <li>Enter the sender’s password.</li>
            <li>Choose Unlock & recover.</li>
          </ol>
          <p className="muted">
            There is no forgotten-password reset for local files.
          </p>
        </article>
        <article className="panel">
          <h2>Use Secure Share</h2>
          <p className="muted">
            Sign in, choose your document and cover, set a password and an
            expiry allowed by your plan. Send the carrier and recipient URL,
            with the password separately. The recipient selects the carrier on
            that URL. Manage or revoke access in your dashboard.
          </p>
        </article>
        <article className="panel">
          <h2>When something goes wrong</h2>
          <p className="muted">
            Use the original attachment, not a screenshot or recompressed photo.
            Check the password and share expiry. A pending unlock may take five
            minutes to expire. Revocation cannot erase files or keys already
            recovered.
          </p>
        </article>
      </section>
    </main>
  );
}
