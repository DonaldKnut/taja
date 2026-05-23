"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowLeft, Clock, Calendar, User, ChevronRight } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Container } from "@/components/layout";
import { BlogArticleBody, BlogJournalFooter, BlogShareBar } from "@/components/blog";
import { formatCurrency, cn } from "@/lib/utils";
import { BLOG_FALLBACK_IMAGE } from "@/lib/blog-constants";

type Props = {
  post: any;
  canonical: string;
};

export function BlogArticleClient({ post: p, canonical }: Props) {
  const date = p.publishedAt ? new Date(p.publishedAt) : null;
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-taja-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      <article className="overflow-hidden">
        {/* Cinematic Editorial Hero */}
        <div className="relative min-h-[70vh] flex items-center justify-center pt-20 overflow-hidden">
          {/* Background Image with Parallax-ready structure */}
          <div className="absolute inset-0 z-0">
            <Image
              src={p.featuredImage || BLOG_FALLBACK_IMAGE}
              alt=""
              fill
              className="object-cover scale-105"
              priority
              sizes="100vw"
            />
            {/* Multi-layer Gradient for depth */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-white" />
          </div>

          <Container size="lg" className="relative z-10 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-white/80 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-all group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Journal Protocol
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                {p.category?.name && (
                  <span
                    className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-white px-5 py-2 rounded-full mb-8 glass-card border-white/20 shadow-huge"
                    style={{ backgroundColor: `${p.category.color || "#10B981"}44` }}
                  >
                    {p.category.name}
                  </span>
                )}
                <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] italic drop-shadow-2xl mb-10 font-sora">
                  {p.title}
                </h1>
                
                <p className="text-lg md:text-2xl text-emerald-50 text-balance leading-relaxed max-w-3xl mx-auto font-medium opacity-90 mb-12">
                  {p.excerpt}
                </p>
              </motion.div>

              {/* Glassmorphism Metadata Bar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="inline-flex flex-wrap items-center justify-center gap-8 px-8 py-6 rounded-3xl glass-card border-white/30 shadow-huge mx-auto backdrop-blur-xl"
              >
                {p.author && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-white/90">{p.author.fullName}</span>
                  </div>
                )}
                
                {date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <time className="text-xs font-black uppercase tracking-widest text-white/90" dateTime={date.toISOString()}>
                      {format(date, "MMM dd, yyyy")}
                    </time>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-white/90">
                    {p.metadata?.readingTime || 5} min read
                  </span>
                </div>
              </motion.div>
            </div>
          </Container>
        </div>

        {/* Content Section */}
        <Container size="lg" className="relative z-20 px-4 sm:px-6 -mt-20">
          <div className="bg-white rounded-[3rem] shadow-huge border border-slate-100 p-8 md:p-20 lg:p-32">
            <BlogShareBar url={canonical} title={p.title} className="mb-20 pb-12 border-b border-dashed border-slate-100" />

            <BlogArticleBody html={p.content} />

            {/* Post Exploration Tags */}
            {p.tags?.length > 0 && (
              <div className="max-w-4xl mx-auto mt-24 pt-12 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Exploration Keywords</p>
                <div className="flex flex-wrap gap-3">
                  {p.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-[10px] font-black uppercase tracking-[0.2em] text-taja-primary px-5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-taja-primary/30 transition-all cursor-default"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Container>

        {/* Commerce Integration / Related Products */}
        {p.relatedProducts && p.relatedProducts.length > 0 && (
          <div className="bg-slate-50 py-32 mt-20 overflow-hidden">
            <Container size="lg" className="px-4 sm:px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-taja-primary">Commerce Integration</span>
                  <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic">Featured Picks.</h2>
                </div>
                <Link 
                  href="/marketplace" 
                  className="inline-flex items-center gap-2 h-14 px-8 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-premium"
                >
                  Visit Marketplace
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {p.relatedProducts.map((prod: any) => (
                  <Link
                    key={String(prod._id)}
                    href={`/product/${prod.slug}`}
                    className="group relative rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden shadow-premium hover:shadow-huge transition-all"
                  >
                    <div className="relative aspect-[5/4] overflow-hidden">
                      <Image
                        src={prod.images?.[0] || BLOG_FALLBACK_IMAGE}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute top-6 right-6">
                        <div className="h-10 px-4 rounded-full glass-card border-white text-taja-primary flex items-center justify-center text-xs font-black shadow-premium">
                          {formatCurrency(prod.price)}
                        </div>
                      </div>
                    </div>
                    <div className="p-8">
                      <p className="text-lg font-black text-slate-900 line-clamp-2 leading-tight mb-4 group-hover:text-taja-primary transition-colors">
                        {prod.title}
                      </p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-taja-primary transition-all flex items-center gap-2">
                        View Artifact <ChevronRight className="w-3 h-3 translate-y-[-1px]" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </Container>
          </div>
        )}
      </article>

      <Container size="lg" className="px-4 sm:px-6 py-32 bg-white">
        <BlogJournalFooter />
      </Container>
    </div>
  );
}
