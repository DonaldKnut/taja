import { generateMetadata as genMeta } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<ReturnType<typeof genMeta>> {
  // In production, fetch product data here
  // For now, return dynamic metadata based on slug
  const productName = params.slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return genMeta({
    title: productName,
    description: `Buy ${productName} on Taja.Shop. Quality products from verified Nigerian sellers with secure escrow payments.`,
    url: `/product/${params.slug}`,
    type: "product",
    keywords: [
      productName,
      `${productName} nigeria`,
      `${productName} online`,
      "buy online nigeria",
      "thrift fashion nigeria",
      "vintage clothing nigeria",
      "second hand clothes nigeria",
      "nigeria ecommerce",
      "taja.shop",
    ],
  });
}

