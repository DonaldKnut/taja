import { generateMetadata as genMeta } from "@/lib/seo";

export const metadata = genMeta({
  title: "Privacy Policy",
  description: "Read Taja.Shop's Privacy Policy. Learn how we collect, use, and protect your personal information.",
  url: "/privacy",
  type: "website",
  noindex: true, // Privacy pages typically don't need to be indexed
});

