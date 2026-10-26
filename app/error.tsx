"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="shell">
      <h1>We couldn’t load this page.</h1>
      <p>Try again shortly. Local Studio may still be available.</p>
      <button className="btn" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
