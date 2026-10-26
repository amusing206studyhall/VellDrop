import AccountForm from "@/components/AccountForm";
export default function Login() {
  return (
    <main className="shell">
      <section className="hero compact">
        <div className="eyebrow">Welcome to VeilDrop</div>
        <h1>Your files. Your control.</h1>
        <p>
          Sign in to manage shares and your subscription. Local Studio works
          without an account.
        </p>
      </section>
      <AccountForm />
    </main>
  );
}
