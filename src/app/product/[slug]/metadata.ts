import { generateMetadata as genMeta } from "@/lib/seo";
import { productsApi } from "@/lib/api";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<ReturnType<typeof genMeta>> {
  try {
    const response = await productsApi.getBySlug(params.slug);

    let product;
    if (response?.data?.product) product = response.data.product;
    else if (response?.data) product = response.data;
    else if (response?.product) product = response.product;
    else product = response;

    if (!product || !product.name) {
      throw new Error("Product not found");
    }

    const productName = product.name || product.title;
    const description = product.description || `Buy ${productName} on Taja.Shop. Quality products from verified Nigerian sellers.`;
    const image = product.images?.[0] || "/og-image.png";

    return genMeta({
      title: productName,
      description: description.substring(0, 160),
      image,
      url: `/product/${params.slug}`,
      type: "product",
      keywords: [
        productName,
        product.category?.name || product.category || "products",
        "nigeria ecommerce",
        "taja.shop",
      ],
    });
  } catch (error) {
    const fallbackName = params.slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return genMeta({
      title: fallbackName,
      description: `Buy ${fallbackName} on Taja.Shop. Quality products from verified Nigerian sellers.`,
      url: `/product/${params.slug}`,
      type: "product",
    });
  }
}

