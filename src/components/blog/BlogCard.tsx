"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowUpRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { BlogPostListItem } from "@/lib/blog-queries";
import { cn } from "@/lib/utils";
import { BLOG_FALLBACK_IMAGE } from "@/lib/blog-constants";

type Props = {
  post: BlogPostListItem;
  index?: number;
  className?: string;
  featured?: boolean;
};

export function BlogCard({ post, index = 0, className, featured }: Props) {
  const cat = post.category as { name?: string; color?: string } | null;
  const author = post.author as { fullName?: string } | null;
  const date = post.publishedAt ? new Date(post.publishedAt) : null;
  const img = post.featuredImage || BLOG_FALLBACK_IMAGE;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={cn("group", className)}
    >
      <Link href={`/blog/${post.slug}`} className="block h-full">
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.75rem] bg-slate-100 border border-slate-100/80 shadow-sm transition-all duration-500",
            "hover:shadow-premium-hover hover:border-taja-primary/15 hover:-translate-y-1",
            featured && "md:min-h-[320px]"
          )}
        >
          <div className={cn("relative aspect-[16/10] overflow-hidden", featured && "md:aspect-[21/9]")}>
            <Image
              src={img}
              alt=""
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-taja-secondary/90 via-taja-secondary/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            {cat?.name && (
              <span
                className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-[0.2em] text-white px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20"
                style={{ backgroundColor: `${cat.color || "#10B981"}cc` }}
              >
                {cat.name}
              </span>
            )}
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3">
              {date && <time dateTime={date.toISOString()}>{format(date, "MMM d, yyyy")}</time>}
              {post.metadata?.readingTime ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.metadata.readingTime} min read
                </span>
              ) : null}
            </div>
            <h2
              className={cn(
                "font-black text-taja-secondary tracking-tight group-hover:text-taja-primary transition-colors line-clamp-2",
                featured ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
              )}
            >
              {post.title}
            </h2>
            <p className="mt-3 text-slate-500 text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
            <div className="mt-6 flex items-center justify-between gap-4">
              {author?.fullName && (
                <span className="text-xs font-semibold text-slate-400">By {author.fullName}</span>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-taja-primary">
                Read
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
