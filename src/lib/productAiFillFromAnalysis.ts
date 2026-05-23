import type { ProductImageAiAnalysis } from "@/lib/ai/imageRecognition";
import {
  isRichTextDescriptionEmpty,
  plainTextToRichHtml,
} from "@/lib/sanitizeProductDescriptionHtml";

export type { ProductImageAiAnalysis } from "@/lib/ai/imageRecognition";

/** Parse first numeric NGN amounts from a human-readable range string. */
export function parseNgnMidFromRange(range: string): string {
  if (!range?.trim()) return "";
  const nums = range.match(/[\d,]+(?:\.\d+)?/g);
  if (!nums?.length) return "";
  const values = nums.map((n) => parseFloat(n.replace(/,/g, ""))).filter((v) => Number.isFinite(v) && v > 0);
  if (!values.length) return "";
  const mid =
    values.length >= 2 ? (values[0] + values[1]) / 2 : values[0];
  return String(Math.round(mid));
}

export function resolveSuggestedPriceString(analysis: ProductImageAiAnalysis): string {
  if (typeof analysis.suggestedPriceNgn === "number" && analysis.suggestedPriceNgn > 0) {
    return String(Math.round(analysis.suggestedPriceNgn));
  }
  return parseNgnMidFromRange(analysis.suggestedPriceRange || "");
}

export function matchCategoryIdFromAiLabel(
  categories: { _id: string; name?: string }[],
  aiLabel: string
): string {
  if (!aiLabel?.trim() || !categories.length) return "";
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const ai = norm(aiLabel);
  let best = "";
  let bestScore = 0;
  for (const c of categories) {
    const n = norm(c.name || "");
    if (!n) continue;
    if (n === ai) return String(c._id);
    if (ai.includes(n) || n.includes(ai)) {
      const score = Math.min(n.length, ai.length);
      if (score > bestScore) {
        bestScore = score;
        best = String(c._id);
      }
    }
  }
  return best;
}

type SeoSlice = { tags: string[]; metaTitle: string; metaDescription: string };
type SpecSlice = Record<string, string>;

export type SellerProductFormLike = {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price: string;
  images: string[];
  specifications: SpecSlice;
  seo: SeoSlice;
};

export function mergeSellerProductFormWithAiAnalysis<T extends SellerProductFormLike>(
  prev: T,
  analysis: ProductImageAiAnalysis,
  opts: {
    categories: { _id: string; name?: string }[];
    imageUrl?: string;
    prependImage?: boolean;
    /** When true (default), replace non-empty fields too. When false, only fill blanks. */
    overwrite?: boolean;
  }
): T {
  const overwrite = opts.overwrite !== false;
  const rawDesc = (analysis.description || "").trim();
  const descHtml = rawDesc ? plainTextToRichHtml(rawDesc) : prev.description;
  const priceStr = resolveSuggestedPriceString(analysis);
  const catId = matchCategoryIdFromAiLabel(opts.categories, analysis.category);
  const tagSet = new Set<string>([
    ...(prev.seo?.tags || []),
    ...(analysis.tags || []).map((t) => String(t).trim()).filter(Boolean),
  ]);
  const tags = [...tagSet].slice(0, 24);

  const colors = analysis.attributes?.colors || [];
  const materials = analysis.attributes?.materials || [];
  const gender = (analysis.attributes?.gender || "").trim();

  const nextImagesRaw =
    opts.imageUrl && opts.prependImage && !prev.images.includes(opts.imageUrl)
      ? [opts.imageUrl, ...prev.images]
      : prev.images;
  const nextImages = nextImagesRaw.slice(0, 8);

  const shouldSet = (current: string) => overwrite || !String(current || "").trim();

  const nextTitle = shouldSet(prev.title) ? analysis.seoTitle || prev.title : prev.title;
  const nextDesc =
    overwrite || isRichTextDescriptionEmpty(prev.description)
      ? rawDesc
        ? descHtml
        : prev.description
      : prev.description;
  const nextPrice = shouldSet(prev.price) && priceStr ? priceStr : prev.price;
  const nextCategory = shouldSet(prev.category) && catId ? catId : prev.category;
  const nextSub =
    shouldSet(prev.subcategory) && analysis.subcategory
      ? analysis.subcategory
      : prev.subcategory;

  const specs = { ...(prev.specifications || {}) };
  if (overwrite || !String(specs.color || "").trim()) {
    specs.color = colors[0] || specs.color || "";
  }
  if (overwrite || !String(specs.material || "").trim()) {
    specs.material =
      materials.length > 0 ? materials.join(", ") : specs.material || "";
  }
  if (overwrite || !String(specs.gender || "").trim()) {
    specs.gender = gender || specs.gender || "";
  }

  return {
    ...prev,
    title: nextTitle,
    description: nextDesc,
    price: nextPrice,
    category: nextCategory,
    subcategory: nextSub,
    images: nextImages,
    specifications: specs,
    seo: {
      ...prev.seo,
      tags,
      metaTitle:
        shouldSet(prev.seo?.metaTitle || "") && analysis.seoTitle
          ? analysis.seoTitle
          : prev.seo?.metaTitle || "",
      metaDescription:
        shouldSet(prev.seo?.metaDescription || "") && analysis.seoDescription
          ? analysis.seoDescription
          : prev.seo?.metaDescription || "",
    },
  };
}

export type AdminProductNewFormLike = {
  title: string;
  description: string;
  category: string;
  price: string;
};

export function mergeAdminProductNewFormWithAiAnalysis(
  prev: AdminProductNewFormLike,
  analysis: ProductImageAiAnalysis,
  opts: {
    categories: { _id: string; name?: string }[];
    overwrite?: boolean;
  }
): AdminProductNewFormLike {
  const overwrite = opts.overwrite !== false;
  const rawDesc = (analysis.description || "").trim();
  const descHtml = rawDesc ? plainTextToRichHtml(rawDesc) : prev.description;
  const priceStr = resolveSuggestedPriceString(analysis);
  const catId = matchCategoryIdFromAiLabel(opts.categories, analysis.category);
  const shouldSet = (current: string) => overwrite || !String(current || "").trim();

  return {
    ...prev,
    title: shouldSet(prev.title) && analysis.seoTitle ? analysis.seoTitle : prev.title,
    description:
      overwrite || isRichTextDescriptionEmpty(prev.description)
        ? rawDesc
          ? descHtml
          : prev.description
        : prev.description,
    price: shouldSet(prev.price) && priceStr ? priceStr : prev.price,
    category: shouldSet(prev.category) && catId ? catId : prev.category,
  };
}
