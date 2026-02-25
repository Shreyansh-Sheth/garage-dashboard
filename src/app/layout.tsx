import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "GARAGES3 — Dashboard",
  description: "Garage management dashboard with neon aesthetics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${GeistMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
