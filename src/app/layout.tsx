import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BurnFat.fun — A Public Ledger for Fat Burned",
  description:
    "Every kilogram burned is recorded permanently. Individual journeys stay private. The global total remains.",
  openGraph: {
    title: "BurnFat.fun — A Public Ledger for Fat Burned",
    description: "Every kilogram burned is recorded permanently.",
    url: process.env.NEXT_PUBLIC_URL || "https://burnfat.fun",
    siteName: "BurnFat.fun",
    type: "website",
    images: [{ url: "https://burnfat.fun/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BurnFat.fun — A Public Ledger for Fat Burned",
    description: "Every kilogram burned is recorded permanently.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
