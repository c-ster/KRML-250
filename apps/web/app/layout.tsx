import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KRML 250 — The Soundtrack of the Monterey Bay",
  description:
    "Listener-driven music campaign for KRML Radio. Submit your three songs, vote, and predict the Top 5 that define the Monterey Bay.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F3EF] text-[#1F1F1F] antialiased">
        {children}
      </body>
    </html>
  );
}
