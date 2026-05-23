import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticleBody, BlogJournalFooter, BlogShareBar, BlogArticleClient } from "@/components/blog";
import { getPublishedPostBySlug, recordPostView } from "@/lib/blog-queries";
import { formatCurrency } from "@/lib/utils";
import { BLOG_FALLBACK_IMAGE } from "@/lib/blog-constants";
import { generateArticleJsonLd } from "@/lib/seo";

export const revalidate = 120;

type Props = { params: { slug: string } };

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taja.shop";

function absImage(url: string | undefined) {
  if (!url) return `${siteUrl}/og-image.png`;
  return url.startsWith("http") ? url : `${siteUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) {
    return {
      title: "Story not found",
      robots: { index: false, follow: false },
    };
  }
  const p = post as {
    title: string;
    excerpt: string;
    tags?: string[];
    author?: { fullName?: string } | null;
    seo?: { title?: string; description?: string; ogImage?: string; keywords?: string[] };
    featuredImage?: string;
    publishedAt?: Date;
    updatedAt?: Date;
  };
  const title = p.seo?.title || p.title;
  const description = (p.seo?.description || p.excerpt || "").slice(0, 160);
  const og = absImage(p.seo?.ogImage || p.featuredImage);
  const path = `/blog/${params.slug}`;
  const canonical = `${siteUrl}${path}`;
  const keywords = [...(p.seo?.keywords || []), ...(p.tags || [])].filter(Boolean);
  const authorName = p.author?.fullName?.trim();

  return {
    title,
    description,
    keywords: keywords.length ? keywords : undefined,
    authors: authorName ? [{ name: authorName }] : [{ name: "Taja.Shop" }],
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Taja.Shop",
      locale: "en_NG",
      type: "article",
      images: [{ url: og, width: 1200, height: 630, alt: title }],
      publishedTime: p.publishedAt ? new Date(p.publishedAt).toISOString() : undefined,
      modifiedTime: p.updatedAt ? new Date(p.updatedAt).toISOString() : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [og],
      creator: "@tajashop",
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) notFound();

  const doc = post as any;
  await recordPostView(String(doc._id));

  const canonical = `${siteUrl}/blog/${params.slug}`;

  const articleLd = generateArticleJsonLd({
    headline: doc.title,
    description: (doc.excerpt || "").slice(0, 500),
    url: canonical,
    imageUrls: [doc.featuredImage || BLOG_FALLBACK_IMAGE].filter(Boolean) as string[],
    datePublished: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : undefined,
    dateModified: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    authorName: doc.author?.fullName,
    section: doc.category?.name,
    keywords: [...(doc.seo?.keywords || []), ...(doc.tags || [])],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <BlogArticleClient post={doc} canonical={canonical} />
    </>
  );
}
