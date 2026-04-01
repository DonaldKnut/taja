import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Stories, guides, and insights from Taja — Nigeria's trusted marketplace for fashion, craft, and independent sellers.",
  keywords: [
    "Taja Journal",
    "Nigeria fashion blog",
    "marketplace stories",
    "Nigerian sellers",
    "Taja.Shop",
  ],
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Journal | Taja.Shop",
    description:
      "Editorial stories, seller spotlights, and guides from Nigeria's trusted marketplace.",
    url: "/blog",
    type: "website",
    locale: "en_NG",
    siteName: "Taja.Shop",
  },
  twitter: {
    card: "summary_large_image",
    title: "Journal | Taja.Shop",
    description: "Stories and guides from the Taja marketplace.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <AppHeader />
      {children}
    </div>
  );
}
