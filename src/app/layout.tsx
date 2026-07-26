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
  title: "Strava World — neumorphic atlas of your runs",
  description:
    "Open-source Next.js app that visualizes Strava runs on a beautiful world map with heatmaps, routes, and photo memories.",
  openGraph: {
    title: "Strava World",
    description:
      "Visualize your Strava runs on a neumorphic world map — heatmaps, routes, and photos.",
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
      <body className="min-h-full font-sans text-[var(--neu-ink)]">
        {children}
      </body>
    </html>
  );
}
