import { generateMetadata as genMeta } from "@/lib/seo";
import { shopsApi } from "@/lib/api";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<ReturnType<typeof genMeta>> {
  try {
    const response = await shopsApi.getBySlug(params.slug);
    const shop = response.success ? response.data : null;

    if (!shop || !shop.shopName) {
      throw new Error("Shop not found");
    }

    const shopName = shop.shopName;
    const description = shop.description || `Visit ${shopName} on Taja.Shop. Browse products from this verified Nigerian seller.`;
    const image = shop.logo || shop.banner || "/og-image.png";

    return genMeta({
      title: shopName,
      description: description.substring(0, 160),
      image,
      url: `/shop/${params.slug}`,
      type: "website",
      keywords: [
        shopName,
        `${shopName} nigeria`,
        "nigerian seller",
        "taja.shop",
        "nigeria marketplace",
      ],
    });
  } catch (error) {
    const fallbackName = params.slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return genMeta({
      title: `${fallbackName} Shop`,
      description: `Visit ${fallbackName} on Taja.Shop. Browse products from this verified Nigerian seller.`,
      url: `/shop/${params.slug}`,
      type: "website",
    });
  }
}

