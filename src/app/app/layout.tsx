import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "BurnFat.fun",
  description: "A public ledger for fat burned by humans.",
  openGraph: {
    title: "BurnFat.fun",
    description: "A public ledger for fat burned by humans.",
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
    return { "fc:miniapp": embed, "fc:frame": embed };
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
  return children;
}
