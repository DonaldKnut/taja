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
        "journal-article-body max-w-4xl mx-auto",
        "prose prose-lg sm:prose-xl prose-slate max-w-none",
        "prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-slate-900 prose-headings:font-sora",
        "prose-h2:text-3xl prose-h2:sm:text-4xl prose-h2:mt-16 prose-h2:mb-8",
        "prose-h3:text-2xl prose-h3:sm:text-3xl prose-h3:mt-12 prose-h3:mb-6",
        "prose-p:text-slate-600/90 prose-p:leading-[1.8] prose-p:text-lg sm:text-xl prose-p:mb-8 transition-colors",
        "prose-strong:text-slate-900 prose-strong:font-black",
        "prose-a:text-taja-primary prose-a:font-bold prose-a:underline-offset-4 prose-a:decoration-2 hover:prose-a:text-taja-secondary transition-all",
        "prose-blockquote:border-l-taja-primary prose-blockquote:border-l-8 prose-blockquote:bg-slate-50 prose-blockquote:rounded-2xl prose-blockquote:py-8 prose-blockquote:px-10 prose-blockquote:not-italic prose-blockquote:text-slate-800 prose-blockquote:font-bold prose-blockquote:text-xl sm:text-2xl prose-blockquote:shadow-sm prose-blockquote:mt-12 prose-blockquote:mb-12",
        "prose-ul:my-8 prose-ol:my-8 prose-li:text-slate-600 prose-li:leading-relaxed",
        "prose-img:rounded-[2.5rem] prose-img:shadow-huge prose-img:mt-16 prose-img:mb-16",
        "prose-hr:border-slate-100 prose-hr:my-16",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
