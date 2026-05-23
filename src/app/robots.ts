import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taja.shop";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/seller/",
          "/checkout/",
          "/order/",
          "/track/",
          "/reset-password/",
          "/verify-email/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

