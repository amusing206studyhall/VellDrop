export default function Refunds() {
  return (
    <main className="shell">
      <section className="hero compact">
        <h1>Cancellations & refunds</h1>
        <p>Live subscriptions are disabled during the deployment beta.</p>
      </section>
      <section className="panel">
        <h2>Cancellation</h2>
        <p className="muted">
          Use Manage subscription in your workspace to open the payment
          provider’s portal. Canceling renewal does not recall previously
          recovered documents.
        </p>
        <h2>Refund requests</h2>
        <p className="muted">
          Before checkout is enabled, the operator must publish the applicable
          refund window, support contact, and consumer-rights terms here. No
          refund entitlement or waiver is implied by this beta notice.
        </p>
      </section>
    </main>
  );
}
