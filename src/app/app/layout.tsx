import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "BurnFat.fun",
  description: "A public ledger for fat burned by humans.",
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
