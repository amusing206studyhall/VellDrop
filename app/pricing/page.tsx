import Link from "next/link";
import PaddleCheckout from "@/components/PaddleCheckout";
import { plans } from "@/lib/plans";
export const dynamic = "force-dynamic";
export default function Pricing() {
  return (
    <main className="shell">
      <section className="hero compact">
        <div className="eyebrow">Simple, honest pricing</div>
        <h1>
          Private by default.
          <br />
          More room to share.
        </h1>
        <p>
          The same encryption on every plan. Choose how often you share and how
          long access stays open.
        </p>
      </section>
      <section className="pricegrid">
        {Object.entries(plans).map(([id, plan]) => (
          <article
            className={"price " + (id === "pro" ? "featured" : "")}
            key={id}
          >
            <div className="eyebrow">
              {id === "pro" ? "For everyday work" : plan.description}
            </div>
            <h2>{plan.name}</h2>
            <strong>${plan.price}</strong>
            <span className="period">
              {id === "free" ? " forever" : " / month"}
            </span>
            <ul>
              <li>Local Studio: unlimited uses</li>
              <li>{plan.shares} online shares / calendar month</li>
              <li>
                Expiry up to {plan.days} {plan.days === 1 ? "day" : "days"}
              </li>
              <li>Custom passwords and revocation</li>
              <li>PNG, WebP and JPEG carriers</li>
              <li>250 MiB document limit on all plans</li>
            </ul>
            {id === "free" ? (
              <Link className="btn" href="/studio">
                Open free Studio
              </Link>
            ) : (
              <PaddleCheckout
                plan={id as "pro" | "plus"}
                enabled={process.env.BILLING_ENABLED === "true"}
                label={"Choose " + plan.name}
              />
            )}
          </article>
        ))}
      </section>
      <section className="callout">
        <p>
          Monthly subscriptions renew until canceled. Manage cancellation in
          your dashboard. Checkout shows applicable taxes and the final charge.
          Plan changes do not recall files a recipient already recovered.
        </p>
      </section>
      <section className="docgrid">
        <article className="panel">
          <h2>Why is Studio free?</h2>
          <p className="muted">
            It runs locally. Hosted plans pay for account services,
            share-control infrastructure and maintenance.
          </p>
        </article>
        <article className="panel">
          <h2>Is this cloud storage?</h2>
          <p className="muted">
            No. You send the original carrier file yourself. VeilDrop manages
            online unlocking; it does not host your document.
          </p>
        </article>
      </section>
    </main>
  );
}
