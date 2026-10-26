import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { accountPlan, plans } from "@/lib/account";
import DashboardActions from "@/components/DashboardActions";
export const dynamic = "force-dynamic";
export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const pool = db(),
    client = await pool.connect();
  try {
    const plan = await accountPlan(client, user.id);
    const shares = await client.query(
      "SELECT id,status,created_at,expires_at,attempts,max_attempts FROM shares WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 100",
      [user.id],
    );
    const usage = await client.query(
      "SELECT count(*)::int AS n FROM shares WHERE owner_id=$1 AND created_at>=date_trunc('month',now())",
      [user.id],
    );
    return (
      <main className="shell">
        <div className="eyebrow">Workspace · {plans[plan].name}</div>
        <section className="hero compact">
          <h1>Your sharing desk.</h1>
          <p>{user.email}</p>
        </section>
        <div className="actions">
          <Link className="btn primary" href="/secure-share">
            New share
          </Link>
          <Link className="btn" href="/studio">
            Local Studio
          </Link>
          <Link className="btn" href="/pricing">
            Change plan
          </Link>
        </div>
        <div className="panel">
          <h2>
            {usage.rows[0].n} / {plans[plan].shares} shares this month
          </h2>
          <p className="muted">
            Up to {plans[plan].days} days per share. The original carrier stays
            with you.
          </p>
          <DashboardActions billing />
        </div>
        <section className="panel" style={{ marginTop: 20 }}>
          <h2>Recent shares</h2>
          {shares.rows.length === 0 ? (
            <p className="muted">Your first share will appear here.</p>
          ) : (
            shares.rows.map((s) => (
              <article className="share-row" key={s.id}>
                <div>
                  <Link href={"/secure-share/" + s.id}>
                    {s.id.slice(0, 8)}…
                  </Link>
                  <div className="small">
                    Expires{" "}
                    {new Date(s.expires_at)
                      .toISOString()
                      .slice(0, 16)
                      .replace("T", " ")}{" "}
                    UTC ·{" "}
                    {new Date(s.expires_at) < new Date() ? "expired" : s.status}
                  </div>
                </div>
                {s.status === "active" && <DashboardActions shareId={s.id} />}
              </article>
            ))
          )}
        </section>
        <form action="/api/account/signout" method="post">
          <button className="btn" style={{ marginTop: 24 }}>
            Sign out
          </button>
        </form>
      </main>
    );
  } finally {
    client.release();
    await pool.end();
  }
}
