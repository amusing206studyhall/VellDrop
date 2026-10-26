import "./globals.css";
import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/Navigation";
export const metadata: Metadata = {
  title: {
    default: "VeilDrop — Private files, familiar images",
    template: "%s · VeilDrop",
  },
  description:
    "Encrypt files on your device and carry them inside an image. Optional online unlocking with expiry and revocation.",
  authors: [{ name: "Md Taufiqur Rahman" }],
  creator: "Md Taufiqur Rahman",
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await headers();
  return (
    <html lang="en">
      <body>
        <Navigation />
        <div id="content">{children}</div>
        <footer className="site-footer">
          <div>
            <strong>VeilDrop</strong>
            <p>
              Made by Md Taufiqur Rahman.
              <br />© 2026 · MIT licensed source
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/security">Security</Link>
            <Link href="/help">Help</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal/refunds">Refunds</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
