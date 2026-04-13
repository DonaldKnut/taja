"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, ShoppingBag, Loader2, ChevronRight, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { getProductPath } from "@/lib/productLinks";

interface Recommendation {
  productId: string;
  reason: string;
  score: number;
  product: {
    _id: string;
    title: string;
    slug: string;
    price: number;
    images: string[];
    rating?: number;
    soldCount?: number;
    shop?: {
      shopName: string;
      shopSlug: string;
    };
  };
}

interface AIRecommendationsProps {
  productId: string;
  type?: "similar" | "frequently_bought" | "trending" | "cross_sell";
  limit?: number;
  title?: string;
}

export function AIRecommendations({
  productId,
  type = "similar",
  limit = 4,
  title,
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await api(
          `/api/ai/recommendations?type=${type}&productId=${productId}&limit=${limit}`
        );

        if (response?.data?.recommendations) {
          setRecommendations(response.data.recommendations);
        }
      } catch (err: any) {
        console.error("Failed to fetch recommendations:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchRecommendations();
    }
  }, [productId, type, limit]);

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case "similar":
        return "You May Also Like";
      case "frequently_bought":
        return "Frequently Bought Together";
      case "trending":
        return "Marketplace Trends";
      case "cross_sell":
        return "Curated Pairings";
      default:
        return "Recommended For You";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "similar":
        return <Sparkles className="h-5 w-5" />;
      case "frequently_bought":
        return <ShoppingBag className="h-5 w-5" />;
      case "trending":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <section className="py-20">
        <div className="flex items-center gap-3 mb-10 overflow-hidden">
          <div className="h-px flex-1 bg-gray-100" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-6">{getTitle()}</h2>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="aspect-[4/5] bg-gray-50 rounded-[2rem]" />
              <div className="h-4 bg-gray-50 rounded-full w-2/3" />
              <div className="h-3 bg-gray-50 rounded-full w-1/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-20">
      <div className="flex items-center gap-3 mb-12 overflow-hidden px-4">
        <div className="h-px flex-1 bg-gray-100" />
        <div className="flex items-center gap-2 px-6">
          <Sparkles className="h-4 w-4 text-taja-primary animate-pulse" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-taja-secondary">{getTitle()}</h2>
        </div>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-4 sm:px-0">
        {recommendations.map((rec, idx) => (
          <motion.div
            key={rec.productId}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={getProductPath(rec.product as any)}
              className="group block"
            >
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-gray-50 mb-5 border border-white/40 shadow-premium transition-all duration-700 group-hover:shadow-premium-hover group-hover:-translate-y-2">
                <Image
                  src={rec.product.images?.[0] || "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png"}
                  alt={rec.product.title}
                  fill
                  className="object-cover transition-transform duration-[2.5s] ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />

                {/* Premium Match Badge */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1 shadow-lg ring-1 ring-white/10">
                    <Sparkles className="h-2.5 w-2.5 text-taja-primary fill-taja-primary" />
                    Elite AI Pick
                  </div>
                  {rec.score > 0.8 && (
                    <div className="w-fit px-3 py-1.5 bg-emerald-500/90 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest shadow-lg">
                      {Math.round(rec.score * 100)}% Match
                    </div>
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>

              <div className="space-y-2 px-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-4 bg-taja-primary/30 rounded-full group-hover:w-8 transition-all duration-500" />
                  {rec.product.shop && (
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate">
                      by {rec.product.shop.shopName}
                    </p>
                  )}
                </div>

                <h3 className="font-bold text-sm text-taja-secondary line-clamp-2 leading-tight group-hover:text-taja-primary transition-colors duration-500">
                  {rec.product.title}
                </h3>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-lg font-black text-taja-secondary tracking-tight">
                    {formatCurrency(rec.product.price)}
                  </p>
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-taja-primary group-hover:text-white transition-all duration-500">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* AI Reason - Subtle */}
                <p className="text-[10px] font-medium text-gray-400 italic line-clamp-1 border-t border-gray-50 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  "{rec.reason}"
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
