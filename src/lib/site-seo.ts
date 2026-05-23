/**
 * Central copy for titles, meta descriptions, and structured data.
 * Written for humans first; includes natural phrases people search (Taja, buy/sell, African sellers).
 */

/** Primary meta description (~150–160 chars) for Google snippets */
export const SITE_META_DESCRIPTION =
  "Taja.Shop is the marketplace to buy anything and sell anything online — built for Nigerian & African entrepreneurs and sellers. Open your shop, list fast, and reach buyers with trusted payments.";

/** Longer blurb for JSON-LD Organization / WebSite */
export const SITE_LONG_DESCRIPTION =
  "Taja (Taja.Shop) is an online marketplace where anyone can sell products and buyers can shop with confidence. We support African entrepreneurs and sellers with shops, discovery, and secure checkout — whether you sell fashion, crafts, thrift, or more. Find what you want, sell what you make, efficiently.";

/** Meta keywords (supplemental; titles + content matter most for ranking) */
export const SITE_KEYWORDS: string[] = [
  "Taja",
  "Taja.Shop",
  "taja shop",
  "taja marketplace",
  "sell online Nigeria",
  "sell online Africa",
  "buy online Nigeria",
  "buy anything online",
  "sell anything online",
  "Nigerian marketplace",
  "African marketplace",
  "African entrepreneurs",
  "African sellers",
  "Nigerian sellers",
  "online shop Nigeria",
  "create online store Nigeria",
  "ecommerce Nigeria",
  "marketplace Nigeria",
  "buy and sell Nigeria",
  "trusted marketplace",
  "sell fashion online Nigeria",
  "thrift Nigeria",
  "handmade Nigeria",
  "Lagos marketplace",
  "Abuja online shopping",
];

/** WebSite schema for Google (search box + brand discovery) */
export function getRootWebSiteJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Taja.Shop",
    alternateName: ["Taja", "Taja Shop", "taja.shop"],
    description: SITE_LONG_DESCRIPTION,
    url: siteUrl,
    inLanguage: "en-NG",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl.replace(/\/$/, "")}/marketplace?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
