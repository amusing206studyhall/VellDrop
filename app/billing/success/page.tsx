import Link from "next/link";
export default function Success() {
  return (
    <main className="shell">
      <section className="hero compact">
        <div className="eyebrow">Checkout returned</div>
        <h1>Thank you.</h1>
        <p>
          Your plan updates after payment confirmation reaches VeilDrop. A
          checkout redirect alone does not activate a subscription.
        </p>
        <Link className="btn primary" href="/dashboard">
          View my plan
        </Link>
      </section>
    </main>
  );
}
