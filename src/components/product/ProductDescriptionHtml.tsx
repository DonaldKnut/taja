"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  looksLikeHtmlDescription,
  sanitizeProductDescriptionHtml,
} from "@/lib/sanitizeProductDescriptionHtml";

interface ProductDescriptionHtmlProps {
  description?: string;
  className?: string;
}

export function ProductDescriptionHtml({ description, className }: ProductDescriptionHtmlProps) {
  const safeHtml = useMemo(() => {
    if (!description?.trim()) return "";
    if (!looksLikeHtmlDescription(description)) return "";
    return sanitizeProductDescriptionHtml(description);
  }, [description]);

  if (!description?.trim()) {
    return (
      <p className="text-gray-400 text-sm font-medium italic">No description provided.</p>
    );
  }

  if (!safeHtml) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "text-gray-600 leading-relaxed text-sm lg:text-base whitespace-pre-wrap",
          className
        )}
      >
        {description}
      </motion.p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "prose prose-sm sm:prose-base prose-slate max-w-none text-gray-600",
        "prose-headings:font-black prose-headings:text-taja-secondary prose-p:leading-relaxed",
        "prose-li:marker:text-taja-primary prose-strong:text-taja-secondary",
        className
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
