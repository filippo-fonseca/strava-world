import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Strava World — a plain atlas of your runs",
  description:
    "Open-source Next.js app that maps your Strava runs: heatmaps, routes, photo memories, and quiet statistics.",
  openGraph: {
    title: "Strava World",
    description:
      "See every place you’ve run — heat, routes, photos, and stats on one map.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-[var(--ink)]">{children}</body>
    </html>
  );
}
