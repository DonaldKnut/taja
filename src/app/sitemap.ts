import { MetadataRoute } from "next";
import { productsApi, shopsApi } from "@/lib/api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taja.shop";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes = [
    "",
    "/marketplace",
    "/how-it-works",
    "/login",
    "/register",
    "/terms",
    "/privacy",
    "/shops",
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly" as any,
    priority: route === "" ? 1 : 0.8,
  }));

  try {
    // Fetch dynamic content
    // We increase limits to capture more items in sitemap (Next.js limit per sitemap is 50k)
    const [productsRes, shopsRes] = await Promise.all([
      productsApi.getAll({ limit: 1000 }).catch(() => ({ success: false, data: { products: [] } })),
      shopsApi.getAll({ limit: 500 }).catch(() => ({ success: false, data: { shops: [] } })),
    ]);

    const productRoutes = (productsRes.success ? (productsRes.data.products || []) : []).map((p: any) => ({
      url: `${siteUrl}/product/${p.slug}`,
      lastModified: new Date(p.updatedAt || p.createdAt || new Date()),
      changeFrequency: "weekly" as any,
      priority: 0.6,
    }));

    const shopRoutes = (shopsRes.success ? (shopsRes.data.shops || []) : []).map((s: any) => ({
      url: `${siteUrl}/shop/${s.shopSlug}`,
      lastModified: new Date(s.updatedAt || s.createdAt || new Date()),
      changeFrequency: "weekly" as any,
      priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes, ...shopRoutes];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return staticRoutes;
  }
}

