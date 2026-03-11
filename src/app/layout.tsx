import type { Metadata } from "next";
import { Orbitron, Space_Mono } from "next/font/google";
import Providers from "@/providers/Providers";
import "./globals.css";


const orbitron = Orbitron({
  weight: ["700", "900"],
  subsets: ["latin"],
  variable: "--font-title",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
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
  other: (() => {
    const embed = JSON.stringify({
      version: "1",
      imageUrl: "https://burnfat.fun/og.png",
      button: {
        title: "Open BurnFat.fun",
        action: {
          type: "launch_miniapp",
          url: "https://burnfat.fun/app",
        },
      },
    });
    return {
      "base:app_id": "69a4379b955255bb0fb04e69",
      "fc:miniapp": embed,
      "fc:frame": embed,
    };
  })(),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body className={`${orbitron.variable} ${spaceMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
