import { generateMetadata as genMeta } from "@/lib/seo";
import { SITE_KEYWORDS } from "@/lib/site-seo";

export const metadata = genMeta({
  title: "How It Works — Sell & Buy on Taja",
  description:
    "Learn how Taja works for Nigerian and African entrepreneurs: open your shop, list products, sell online, and reach buyers with escrow and trusted tools. Buyers: learn how to shop safely.",
  url: "/how-it-works",
  type: "website",
  keywords: [
    ...SITE_KEYWORDS,
    "how Taja works",
    "sell online guide",
    "create shop Nigeria",
    "seller verification",
    "buyer guide",
  ],
});

