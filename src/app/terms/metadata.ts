import { generateMetadata as genMeta } from "@/lib/seo";

export const metadata = genMeta({
  title: "Terms of Service",
  description: "Read Taja.Shop's Terms of Service. Understand the rules and guidelines for using our marketplace platform.",
  url: "/terms",
  type: "website",
  noindex: true, // Terms pages typically don't need to be indexed
});

