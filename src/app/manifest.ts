import type { MetadataRoute } from "next";
import { tajaAppIconSized } from "@/lib/brandAssets";

export default function manifest(): MetadataRoute.Manifest {
  const icon192 = tajaAppIconSized(192);
  const icon512 = tajaAppIconSized(512);

  return {
    name: "Taja.Shop — Buy & Sell Online",
    short_name: "Taja",
    description:
      "Marketplace for Nigerian and African sellers: buy anything, sell anything, open your shop, shop with confidence.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#10B981",
    orientation: "portrait-primary",
    icons: [
      {
        src: icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["shopping", "marketplace", "ecommerce"],
    shortcuts: [
      {
        name: "Marketplace",
        short_name: "Shop",
        description: "Browse products",
        url: "/marketplace",
        icons: [{ src: icon192, sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "View your account",
        url: "/dashboard",
        icons: [{ src: icon192, sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
