import "./globals.css";
import type { Metadata } from "next";
import { ClientAppShell } from "@/components/ClientAppShell";
import {
  SITE_KEYWORDS,
  SITE_META_DESCRIPTION,
  SITE_LONG_DESCRIPTION,
  getRootWebSiteJsonLd,
} from "@/lib/site-seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taja.shop";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Taja.Shop — Buy & Sell Online | Marketplace for Nigerian & African Sellers",
    template: "%s | Taja.Shop",
  },
  description: SITE_META_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: "Taja.Shop Team" }],
  creator: "Taja.Shop Team",
  publisher: "Taja.Shop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Taja.Shop — Buy & Sell Online | Marketplace for Nigerian & African Sellers",
    description: SITE_META_DESCRIPTION,
    url: siteUrl,
    siteName: "Taja.Shop",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Taja.Shop — Buy & sell online with Nigerian and African sellers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Taja.Shop — Buy & Sell Online | Marketplace for Nigerian & African Sellers",
    description: SITE_META_DESCRIPTION,
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
              alternateName: ["Taja", "Taja Shop", "taja.shop"],
              url: siteUrl,
              logo: `${siteUrl}/favicon.png`,
              description: SITE_LONG_DESCRIPTION,
              ...(process.env.NEXT_PUBLIC_SUPPORT_PHONE
                ? {
                    contactPoint: {
                      "@type": "ContactPoint",
                      telephone: process.env.NEXT_PUBLIC_SUPPORT_PHONE,
                      contactType: "customer service",
                      areaServed: "NG",
                      availableLanguage: ["en"],
                    },
                  }
                : {}),
              sameAs: [
                "https://instagram.com/taja.shop",
                "https://twitter.com/tajashop",
                "https://facebook.com/taja.shop",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getRootWebSiteJsonLd(siteUrl)),
          }}
        />
      </head>
      <body>
        <ClientAppShell>{children}</ClientAppShell>
      </body>
    </html>
  );
}
