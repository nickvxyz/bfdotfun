import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";

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
  metadataBase: new URL("https://burnfat.fun"),
  title: "BurnFat.fun",
  description: "A public ledger for fat burned by humans.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "BurnFat.fun",
    description: "A public ledger for fat burned by humans.",
    url: "https://burnfat.fun/app",
    siteName: "BurnFat.fun",
    type: "website",
    images: [{ url: "https://burnfat.fun/og.png", width: 1536, height: 1024 }],
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
      "fc:miniapp": embed,
      "fc:frame": embed,
      "base:app_id": "69a4379b955255bb0fb04e69",
    };
  })(),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function MiniAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${chakraPetch.variable} ${ibmPlexMono.variable}`}>
      {children}
    </div>
  );
}
