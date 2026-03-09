import "./globals.css";
import type { Metadata } from "next";
import { ClientAppShell } from "@/components/ClientAppShell";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taja.shop";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Taja.Shop - Nigeria's Trusted Marketplace",
    template: "%s | Taja.Shop",
  },
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
  creator: "Taja.Shop Team",
  publisher: "Taja.Shop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Taja.Shop - Nigeria's Trusted Marketplace",
    description:
      "Give every Nigerian seller their own online shop and trusted community marketplace.",
    url: siteUrl,
    siteName: "Taja.Shop",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Taja.Shop - Nigeria's Trusted Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Taja.Shop - Nigeria's Trusted Marketplace",
    description:
      "Give every Nigerian seller their own online shop and trusted community marketplace.",
    images: ["/og-image.png"],
    creator: "@tajashop",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Global Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Taja.Shop",
              url: siteUrl,
              logo: `${siteUrl}/favicon.png`,
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+234-XXX-XXXX-XXX",
                contactType: "customer service",
                areaServed: "NG",
                availableLanguage: "en",
              },
              sameAs: [
                "https://instagram.com/taja.shop",
                "https://twitter.com/tajashop",
                "https://facebook.com/taja.shop",
              ],
            }),
          }}
        />
      </head>
      <body>
        <ClientAppShell>{children}</ClientAppShell>
      </body>
    </html>
  );
}
