import SecureShare from "@/components/SecureShare";
import Link from "next/link";
import { currentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Share() {
  if (process.env.SECURE_SHARE_ENABLED !== "true")
    return (
      <main className="shell">
        <section className="hero">
          <div className="eyebrow">Deployment beta</div>
          <h1>Secure Share is coming online.</h1>
          <p>
            Online unlocking will open after account setup and deployment
            checks. You can use Local Studio now.
          </p>
          <Link className="btn primary" href="/studio">
            Open Studio
          </Link>
        </section>
      </main>
    );
  if (!(await currentUser())) redirect("/login");
  return <SecureShare />;
}
