import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Clock, Star } from "lucide-react";
import { Container } from "@/components/layout";
import { BlogArticleBody, BlogJournalFooter, BlogShareBar } from "@/components/blog";
import { getPublishedPostBySlug, recordPostView } from "@/lib/blog-queries";
import { formatCurrency } from "@/lib/utils";
import { BLOG_FALLBACK_IMAGE } from "@/lib/blog-constants";

export const revalidate = 120;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) {
    return { title: "Story not found" };
  }
  const p = post as {
    title: string;
    excerpt: string;
    seo?: { title?: string; description?: string; ogImage?: string };
    featuredImage?: string;
  };
  const title = p.seo?.title || p.title;
  const description = p.seo?.description || p.excerpt;
  const og = p.seo?.ogImage || p.featuredImage;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: og ? [og] : undefined,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) notFound();

  const doc = post as unknown as {
    _id: string;
    title: string;
    excerpt: string;
    content: string;
    publishedAt?: Date;
    tags: string[];
    metadata: { readingTime: number; views: number };
    author?: { fullName?: string; avatar?: string } | null;
    category?: { name: string; slug: string; color?: string } | null;
    featuredImage?: string;
    relatedProducts?: Array<{
      _id: string;
      title: string;
      slug: string;
      price: number;
      images?: string[];
      averageRating?: number;
    }>;
  };

  await recordPostView(String(doc._id));

  const p = doc;

  const date = p.publishedAt ? new Date(p.publishedAt) : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taja.shop";
  const canonical = `${siteUrl}/blog/${params.slug}`;

  return (
    <article>
      <div className="relative min-h-[42vh] sm:min-h-[50vh] flex items-end">
        <div className="absolute inset-0">
          <Image
            src={p.featuredImage || BLOG_FALLBACK_IMAGE}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-taja-secondary via-taja-secondary/70 to-taja-secondary/30" />
        </div>
        <Container size="lg" className="relative z-10 pb-12 sm:pb-16 px-4 sm:px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/90 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Journal
          </Link>
          {p.category?.name && (
            <span
              className="inline-block text-[10px] font-black uppercase tracking-[0.25em] text-white px-3 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: `${p.category.color || "#10B981"}cc` }}
            >
              {p.category.name}
            </span>
          )}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.05] max-w-4xl italic">
            {p.title}
          </h1>
          <p className="mt-6 text-lg text-emerald-100/90 max-w-2xl leading-relaxed">{p.excerpt}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/80">
            {p.author?.fullName && <span className="font-semibold">By {p.author.fullName}</span>}
            {date && (
              <time dateTime={date.toISOString()}>{format(date, "MMMM d, yyyy")}</time>
            )}
            {p.metadata?.readingTime ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {p.metadata.readingTime} min read
              </span>
            ) : null}
          </div>
        </Container>
      </div>

      <Container size="lg" className="px-4 sm:px-6 py-12 sm:py-16">
        <BlogShareBar url={canonical} title={p.title} className="mb-12 pb-10 border-b border-slate-100" />

        <BlogArticleBody html={p.content} />

        {p.tags?.length > 0 && (
          <div className="max-w-3xl mx-auto mt-16 pt-10 border-t border-slate-100 flex flex-wrap gap-2">
            {p.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1.5 rounded-full bg-slate-100"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {p.relatedProducts && p.relatedProducts.length > 0 && (
          <div className="max-w-5xl mx-auto mt-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-taja-primary mb-6">Featured picks</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {p.relatedProducts.map((prod) => (
                <Link
                  key={String(prod._id)}
                  href={`/product/${prod.slug}`}
                  className="group rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-premium transition-all"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image
                      src={prod.images?.[0] || BLOG_FALLBACK_IMAGE}
                      alt=""
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-taja-secondary line-clamp-2 group-hover:text-taja-primary transition-colors">
                      {prod.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-lg font-black text-taja-secondary">{formatCurrency(prod.price)}</span>
                      {typeof prod.averageRating === "number" && prod.averageRating > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {prod.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>

      <Container size="lg" className="px-4 sm:px-6 pb-24">
        <BlogJournalFooter />
      </Container>
    </article>
  );
}
