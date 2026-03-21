"use client";

import { cn } from "@/lib/utils";

type Props = {
  html: string;
  className?: string;
};

/**
 * Renders trusted HTML from the CMS / admin. Content is authored by staff only.
 */
export function BlogArticleBody({ html, className }: Props) {
  return (
    <div
      className={cn(
        "journal-article-body max-w-3xl mx-auto",
        "prose prose-lg prose-slate max-w-none",
        "prose-headings:font-black prose-headings:tracking-tight prose-headings:text-taja-secondary",
        "prose-h2:text-2xl prose-h2:sm:text-3xl prose-h3:text-xl prose-h3:sm:text-2xl",
        "prose-p:text-slate-600 prose-p:leading-relaxed prose-p:font-medium",
        "prose-strong:text-taja-secondary prose-strong:font-bold",
        "prose-a:text-taja-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline",
        "prose-blockquote:border-l-taja-primary prose-blockquote:border-l-4 prose-blockquote:bg-taja-light/40 prose-blockquote:rounded-r-2xl prose-blockquote:py-2 prose-blockquote:not-italic prose-blockquote:text-slate-500",
        "prose-ul:my-6 prose-ol:my-6 prose-li:text-slate-600",
        "prose-img:rounded-2xl prose-img:shadow-premium",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
