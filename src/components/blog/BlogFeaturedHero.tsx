import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowRight, Sparkles } from "lucide-react";
import type { BlogPostListItem } from "@/lib/blog-queries";
import { BLOG_FALLBACK_IMAGE } from "@/lib/blog-constants";

type Props = { post: BlogPostListItem };

export function BlogFeaturedHero({ post }: Props) {
  const cat = post.category as { name?: string; color?: string } | null;
  const author = post.author as { fullName?: string } | null;
  const date = post.publishedAt ? new Date(post.publishedAt) : null;
  const img = post.featuredImage || BLOG_FALLBACK_IMAGE;

  return (
    <section className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/60 bg-gradient-to-br from-taja-light via-white to-emerald-50/30 shadow-premium">
      <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-taja-primary/[0.07] to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-taja-primary/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

      <div className="relative grid lg:grid-cols-2 gap-0 lg:gap-12 items-stretch min-h-[420px] lg:min-h-[480px]">
        <div className="p-8 sm:p-10 lg:p-14 flex flex-col justify-center order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-taja-primary mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Editor&apos;s pick
          </div>
          {cat?.name && (
            <span
              className="inline-flex w-fit text-[10px] font-black uppercase tracking-[0.2em] text-white px-3 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: cat.color || "#10B981" }}
            >
              {cat.name}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-taja-secondary tracking-tighter leading-[1.1] italic">
            {post.title}
          </h1>
          <p className="mt-6 text-slate-600 text-lg leading-relaxed max-w-xl">{post.excerpt}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            {date && (
              <time dateTime={date.toISOString()} className="font-semibold">
                {format(date, "MMMM d, yyyy")}
              </time>
            )}
            {author?.fullName && (
              <>
                <span className="text-slate-300">·</span>
                <span>By {author.fullName}</span>
              </>
            )}
            {post.metadata?.readingTime ? (
              <>
                <span className="text-slate-300">·</span>
                <span>{post.metadata.readingTime} min read</span>
              </>
            ) : null}
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="mt-10 inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-taja-secondary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-premium hover:bg-taja-primary transition-all hover:scale-[1.02] w-fit group"
          >
            Read the story
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="relative block order-1 lg:order-2 min-h-[240px] lg:min-h-0 rounded-t-[2rem] lg:rounded-r-[2.5rem] lg:rounded-l-none lg:rounded-t-[2.5rem] overflow-hidden group"
        >
          <Image
            src={img}
            alt=""
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-taja-secondary/50 to-transparent opacity-40 lg:opacity-30" />
        </Link>
      </div>
    </section>
  );
}
