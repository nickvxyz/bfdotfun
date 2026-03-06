import type { Metadata } from "next";
import { Inter, Chakra_Petch, IBM_Plex_Mono } from "next/font/google";
import Providers from "@/providers/Providers";
import "./globals.css";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const chakraPetch = Chakra_Petch({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-title",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "700"],
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
    <html lang="en" data-theme="dark">
      <head />
      <body className={`${inter.variable} ${chakraPetch.variable} ${ibmPlexMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
