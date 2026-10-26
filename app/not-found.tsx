import Link from "next/link";
export default function Missing() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="eyebrow">404</div>
        <h1>That page isn’t here.</h1>
        <p>Check the original link or return to your workspace.</p>
        <Link className="btn" href="/">
          Go home
        </Link>
      </section>
    </main>
  );
}
