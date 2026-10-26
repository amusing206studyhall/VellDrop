export default function Contact() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <main className="shell">
      <section className="hero compact">
        <div className="eyebrow">Support & feedback</div>
        <h1>Talk to the maker.</h1>
        <p>VeilDrop is a project by Md Taufiqur Rahman.</p>
      </section>
      <section className="panel">
        <h2>Product or billing help</h2>
        {email ? (
          <a className="btn" href={"mailto:" + email}>
            {email}
          </a>
        ) : (
          <p className="muted">
            The public support address will be listed before subscriptions open.
          </p>
        )}
        <p className="muted">
          Include the issue and browser version. Never send a document password,
          private management URL, or confidential document.
        </p>
      </section>
    </main>
  );
}
