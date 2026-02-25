import "./globals.css";
import type { Metadata } from "next";
import { ClientAppShell } from "@/components/ClientAppShell";

export const metadata: Metadata = {
  title: "Taja.Shop - Nigeria's Trusted Marketplace",
  description:
    "Next-generation Nigerian e-commerce marketplace for thrift fashion, vintage items, and handmade crafts. From DMs to your own shop.",
  keywords: [
    "taja.shop",
    "nigeria ecommerce",
    "nigerian marketplace",
    "online thrift store nigeria",
    "thrift fashion nigeria",
    "vintage clothes nigeria",
    "second hand clothes nigeria",
    "handmade crafts nigeria",
    "buy and sell nigeria",
    "online shopping nigeria",
    "nigerian sellers",
    "virtual try on nigeria",
    "escrow payments nigeria",
    "lagos thrift store",
    "abuja thrift fashion",
    "nigeria online marketplace",
  ],
  authors: [{ name: "Taja.Shop Team" }],
  openGraph: {
    title: "Taja.Shop - Nigeria's Trusted Marketplace",
    description:
      "Give every Nigerian seller their own online shop and trusted community marketplace.",
    url: "https://taja.shop",
    siteName: "Taja.Shop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Taja.Shop - Nigeria's Trusted Marketplace",
    description:
      "Give every Nigerian seller their own online shop and trusted community marketplace.",
  },
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// Force dynamic rendering to prevent prerendering issues with client components
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10B981" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClientAppShell>{children}</ClientAppShell>
      </body>
    </html>
  );
}
