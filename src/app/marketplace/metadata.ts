import { generateMetadata as genMeta } from "@/lib/seo";
import { SITE_KEYWORDS } from "@/lib/site-seo";

export const metadata = genMeta({
  title: "Marketplace — Buy Online from Verified Sellers",
  description:
    "Browse Taja.Shop marketplace: buy fashion, crafts, thrift, and more from verified Nigerian and African sellers. Search, compare, and shop with confidence.",
  url: "/marketplace",
  type: "website",
  keywords: [
    ...SITE_KEYWORDS,
    "browse marketplace",
    "buy from sellers",
    "verified sellers",
    "virtual try on",
  ],
});

