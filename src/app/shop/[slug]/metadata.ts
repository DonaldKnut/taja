import { generateMetadata as genMeta } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<ReturnType<typeof genMeta>> {
  // In production, fetch shop data here
  const shopName = params.slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return genMeta({
    title: `${shopName} Shop`,
    description: `Visit ${shopName} on Taja.Shop. Browse products from this verified Nigerian seller with secure escrow payments.`,
    url: `/shop/${params.slug}`,
    type: "website",
    keywords: [
      shopName,
      `${shopName} nigeria`,
      `${shopName} online shop`,
      `${shopName} thrift store`,
      "nigerian seller",
      "nigeria online shop",
      "taja.shop",
      "nigeria marketplace",
      "thrift fashion nigeria",
    ],
  });
}

