import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "BurnFat.fun",
  description: "A public ledger for fat burned by humans.",
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: "https://burnfat.fun/icon.png",
      button: {
        title: "Open BurnFat.fun",
        action: {
          type: "launch_miniapp",
          url: "https://burnfat.fun/app",
        },
      },
    }),
  },
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
