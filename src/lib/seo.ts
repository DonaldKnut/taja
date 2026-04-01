import type { Metadata } from "next";
import { SITE_META_DESCRIPTION, SITE_LONG_DESCRIPTION } from "@/lib/site-seo";

const siteName = "Taja.Shop";
const defaultTitle = "Taja.Shop — Buy & Sell Online | Marketplace for Nigerian & African Sellers";
const defaultDescription = SITE_META_DESCRIPTION;
const defaultImage = "/og-image.png";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taja.shop";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  price?: number;
  currency?: string;
  availability?: "in stock" | "out of stock" | "preorder";
}

export function generateMetadata({
  title,
  description,
  image,
  url,
  type = "website",
  noindex = false,
  keywords = [],
  publishedTime,
  modifiedTime,
  author,
  price,
  currency = "NGN",
  availability,
}: SEOProps): Metadata {
  const fullTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const fullDescription = description || defaultDescription;
  const fullImage = image ? (image.startsWith("http") ? image : `${siteUrl}${image}`) : `${siteUrl}${defaultImage}`;
  const fullUrl = url ? (url.startsWith("http") ? url : `${siteUrl}${url}`) : siteUrl;

  const metadata: Metadata = {
    title: fullTitle,
    description: fullDescription,
    robots: noindex ? "noindex, nofollow" : "index, follow",
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: fullUrl,
      siteName,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      type: type === "product" ? "website" : type,
      publishedTime,
      modifiedTime,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
    },
    alternates: {
      canonical: fullUrl,
    },
  };

  // Note: OpenGraph doesn't support "product" type, so we use "website"
  // Product-specific data is handled via structured data (JSON-LD)

  return metadata;
}

// Structured Data (JSON-LD)
export function generateStructuredData({
  type,
  data,
}: {
  type: "Organization" | "Product" | "BreadcrumbList" | "WebSite" | "LocalBusiness";
  data: any;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taja.shop";

  const schemas: Record<string, any> = {
    Organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Taja.Shop",
      alternateName: ["Taja", "Taja Shop", "taja.shop"],
      url: baseUrl,
      logo: "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png",
      description: SITE_LONG_DESCRIPTION,
      sameAs: [
        "https://instagram.com/taja.shop",
        "https://twitter.com/tajashop",
        "https://facebook.com/taja.shop",
      ],
      ...data,
    },
    Product: {
      "@context": "https://schema.org",
      "@type": "Product",
      ...data,
    },
    BreadcrumbList: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: data.items,
    },
    WebSite: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Taja.Shop",
      alternateName: ["Taja", "Taja Shop", "taja.shop"],
      description: SITE_LONG_DESCRIPTION,
      url: baseUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/marketplace?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      ...data,
    },
    LocalBusiness: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Taja.Shop",
      description: "Nigerian e-commerce marketplace",
      ...data,
    },
  };

  return schemas[type] || {};
}

// Generate breadcrumb structured data
export function generateBreadcrumbs(items: Array<{ name: string; url: string }>) {
  return generateStructuredData({
    type: "BreadcrumbList",
    data: {
      items: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
      })),
    },
  });
}

// Generate product structured data
export function generateProductStructuredData(product: {
  name: string;
  description: string;
  image: string | string[];
  price: number;
  maxPrice?: number;
  currency?: string;
  availability?: string;
  condition?: string;
  brand?: string;
  sku?: string;
  url: string;
  rating?: { value: number; count: number };
  shopName?: string;
}) {
  const images = Array.isArray(product.image) ? product.image : [product.image];
  const fullImages = images.map((img) =>
    img.startsWith("http") ? img : `${siteUrl}${img}`
  );
  const fullUrl = product.url.startsWith("http") ? product.url : `${siteUrl}${product.url}`;

  const structuredData: any = {
    name: product.name,
    description: product.description,
    image: fullImages,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency || "NGN",
      availability: product.availability
        ? `https://schema.org/${product.availability === "in stock" ? "InStock" : "OutOfStock"}`
        : "https://schema.org/InStock",
      url: fullUrl,
    },
    url: fullUrl,
  };

  if (product.maxPrice && product.maxPrice > product.price) {
    structuredData.offers = {
      "@type": "AggregateOffer",
      lowPrice: product.price,
      highPrice: product.maxPrice,
      priceCurrency: product.currency || "NGN",
      offerCount: 1,
      availability: structuredData.offers.availability,
    };
  }

  if (product.condition) {
    structuredData.itemCondition = `https://schema.org/${product.condition === "new" ? "NewCondition" : "UsedCondition"}`;
  }

  if (product.brand || product.shopName) {
    structuredData.brand = {
      "@type": "Brand",
      name: product.brand || product.shopName,
    };
  }

  if (product.sku) {
    structuredData.sku = product.sku;
  }

  if (product.rating) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating.value,
      reviewCount: product.rating.count,
    };
  }

  return generateStructuredData({
    type: "Product",
    data: structuredData,
  });
}

/** Article / BlogPosting JSON-LD for Journal posts */
export function generateArticleJsonLd(input: {
  headline: string;
  description: string;
  url: string;
  imageUrls: string[];
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  section?: string;
  keywords?: string[];
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taja.shop";
  const logoUrl = `${baseUrl}/favicon.png`;
  const images = input.imageUrls
    .filter(Boolean)
    .map((u) => (u.startsWith("http") ? u : `${siteUrl}${u.startsWith("/") ? u : `/${u}`}`));

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
    },
    image: images.length ? images : [`${baseUrl}/og-image.png`],
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    author: input.authorName
      ? {
          "@type": "Person",
          name: input.authorName,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
    },
    ...(input.section ? { articleSection: input.section } : {}),
    ...(input.keywords?.length ? { keywords: input.keywords.join(", ") } : {}),
  };
}

// Generate shop (LocalBusiness) structured data
export function generateShopStructuredData(shop: {
  name: string;
  description: string;
  logo?: string;
  url: string;
  image?: string;
  address?: string;
  telephone?: string;
  rating?: { value: number; count: number };
  priceRange?: string;
}) {
  const fullUrl = shop.url.startsWith("http") ? shop.url : `${siteUrl}${shop.url}`;
  const fullLogo = shop.logo ? (shop.logo.startsWith("http") ? shop.logo : `${siteUrl}${shop.logo}`) : undefined;
  const fullImage = shop.image ? (shop.image.startsWith("http") ? shop.image : `${siteUrl}${shop.image}`) : fullLogo;

  const structuredData: any = {
    name: shop.name,
    description: shop.description,
    url: fullUrl,
    image: fullImage,
    priceRange: shop.priceRange || "₦₦",
  };

  if (fullLogo) {
    structuredData.logo = fullLogo;
  }

  if (shop.address) {
    structuredData.address = {
      "@type": "PostalAddress",
      streetAddress: shop.address,
      addressCountry: "NG",
    };
  }

  if (shop.telephone) {
    structuredData.telephone = shop.telephone;
  }

  if (shop.rating) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: shop.rating.value,
      reviewCount: shop.rating.count,
    };
  }

  return generateStructuredData({
    type: "LocalBusiness",
    data: structuredData,
  });
}
