import Link from "next/link";

export default function SecurityPage() {
  return (
    <main className="shell">
      <section className="hero compact">
        <div className="eyebrow">Security model</div>
        <h1>Encryption first. Claims second.</h1>
        <p>
          VeilDrop uses established authenticated encryption and a separation
          between local cryptography and the hosted access-control plane.
        </p>
      </section>
      <section className="docgrid">
        <article className="panel">
          <h2>Local mode</h2>
          <ul>
            <li>AES-256-GCM encrypts the document.</li>
            <li>
              PBKDF2-HMAC-SHA-256 derives the local encryption key from a
              password.
            </li>
            <li>
              Random salts and nonces are generated with the browser
              cryptographic RNG.
            </li>
            <li>The encrypted payload is stored inside a carrier container.</li>
            <li>No server is required for local recovery.</li>
          </ul>
        </article>
        <article className="panel">
          <h2>Secure Share</h2>
          <ul>
            <li>A random 256-bit data-encryption key encrypts the document.</li>
            <li>
              OPAQUE provides password-authenticated access without sending the
              password to the server.
            </li>
            <li>
              The data key is wrapped with a client-held OPAQUE export key.
            </li>
            <li>
              The server stores the wrapped key, not the plaintext document.
            </li>
            <li>
              Access is expired, rate-limited and subject to a server-side
              attempt policy.
            </li>
          </ul>
        </article>
        <article className="panel">
          <h2>Threats we address</h2>
          <ul>
            <li>Stolen carrier file without the password.</li>
            <li>Ciphertext modification.</li>
            <li>Repeated online authentication attempts.</li>
            <li>New server key releases after expiry or revocation.</li>
          </ul>
        </article>
        <article className="panel">
          <h2>Threats we do not magically solve</h2>
          <ul>
            <li>Compromised recipient devices.</li>
            <li>Weak passwords.</li>
            <li>Malicious browser extensions or modified client code.</li>
            <li>Re-encoded or transformed carrier images.</li>
            <li>Compromise of production infrastructure or signing keys.</li>
          </ul>
        </article>
        <article className="panel">
          <h2>What revocation means</h2>
          <p className="muted">
            Revocation blocks future server unlocks. A recipient can keep
            recovered files or cached key material. Database backups may retain
            records. The image carrier is detectable and may preserve original
            image metadata.
          </p>
        </article>
      </section>
      <footer className="footer">
        No independent audit has been completed.
      </footer>
    </main>
  );
}
