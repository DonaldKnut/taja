import type { Metadata } from "next";

const siteName = "Taja.Shop";
const defaultTitle = "Taja.Shop - Nigeria's Trusted Marketplace";
const defaultDescription =
  "Next-generation Nigerian e-commerce marketplace for thrift fashion, vintage items, and handmade crafts. From DMs to your own shop.";
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
      url: baseUrl,
      logo: "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png",
      description:
        "Nigeria's trusted e-commerce marketplace for thrift fashion, vintage items, and handmade crafts.",
      sameAs: [
        // Add social media links when available
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
  currency?: string;
  availability?: string;
  condition?: string;
  brand?: string;
  sku?: string;
  url: string;
  rating?: { value: number; count: number };
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

  if (product.condition) {
    structuredData.itemCondition = `https://schema.org/${product.condition}`;
  }

  if (product.brand) {
    structuredData.brand = {
      "@type": "Brand",
      name: product.brand,
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
