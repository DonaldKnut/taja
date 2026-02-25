import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taja.shop";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/marketplace",
    "/how-it-works",
    "/login",
    "/register",
    "/terms",
    "/privacy",
    "/shops",
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}

