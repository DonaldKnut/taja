"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, ShoppingBag, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

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
        return "Customers Also Bought";
      case "trending":
        return "Trending Now";
      case "cross_sell":
        return "Complete Your Look";
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
        return <Sparkles className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-taja-primary/10 rounded-xl">
            {getIcon()}
          </div>
          <h2 className="text-xl font-bold text-taja-secondary">{getTitle()}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(limit)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-2xl aspect-[3/4] animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-taja-primary/10 rounded-xl text-taja-primary">
          {getIcon()}
        </div>
        <h2 className="text-xl font-bold text-taja-secondary">{getTitle()}</h2>
        <div className="flex-1 h-px bg-gray-100 ml-4" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {recommendations.map((rec, idx) => (
          <motion.div
            key={rec.productId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link
              href={`/product/${rec.product.slug}`}
              className="group block"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 mb-3">
                <Image
                  src={rec.product.images?.[0] || "/placeholder.jpg"}
                  alt={rec.product.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                
                {/* AI Badge */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-taja-primary flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Pick
                </div>

                {/* Score Badge */}
                {rec.score > 0.8 && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-white">
                    {Math.round(rec.score * 100)}% Match
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-taja-secondary line-clamp-2 group-hover:text-taja-primary transition-colors">
                  {rec.product.title}
                </h3>
                
                <p className="text-lg font-bold text-taja-secondary">
                  {formatCurrency(rec.product.price)}
                </p>

                {rec.product.shop && (
                  <p className="text-xs text-gray-400">
                    by {rec.product.shop.shopName}
                  </p>
                )}

                {/* Reason */}
                <p className="text-[10px] text-gray-400 line-clamp-1 mt-1">
                  {rec.reason}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
