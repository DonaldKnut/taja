"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Package, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface Product {
  _id: string;
  title: string;
  slug: string;
  price: number;
  maxPrice?: number;
  images: string[];
  rating?: number;
  soldCount?: number;
  shop?: {
    shopName: string;
    shopSlug: string;
  };
}

interface RecommendationGroup {
  type: string;
  title: string;
  icon: React.ReactNode;
  products: Product[];
}

export function HomepageRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await api("/api/ai/recommendations/homepage");

        if (response?.data) {
          const groups: RecommendationGroup[] = [];

          if (response.data.personalized?.length > 0) {
            groups.push({
              type: 'personalized',
              title: 'Recommended For You',
              icon: <Sparkles className="h-5 w-5" />,
              products: response.data.personalized.map((r: any) => r.product).filter(Boolean),
            });
          }

          if (response.data.trending?.length > 0) {
            groups.push({
              type: 'trending',
              title: 'Trending Now',
              icon: <TrendingUp className="h-5 w-5" />,
              products: response.data.trending.map((r: any) => r.product).filter(Boolean),
            });
          }

          if (response.data.newArrivals?.length > 0) {
            groups.push({
              type: 'new',
              title: 'New Arrivals',
              icon: <Package className="h-5 w-5" />,
              products: response.data.newArrivals.map((r: any) => r.product).filter(Boolean),
            });
          }

          setRecommendations(groups);
        }
      } catch (err: any) {
        console.error("Failed to fetch homepage recommendations:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading recommendations...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-taja-primary/10 border border-taja-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-taja-primary" />
            <span className="text-[10px] font-black text-taja-primary uppercase tracking-widest">AI-Powered</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-taja-secondary tracking-tight mb-4">
            Curated Just For You
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Discover products tailored to your style and preferences, powered by our intelligent recommendation engine.
          </p>
        </div>

        <div className="space-y-20">
          {recommendations.map((group, groupIndex) => (
            <motion.div
              key={group.type}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-taja-primary/10 rounded-xl text-taja-primary">
                    {group.icon}
                  </div>
                  <h3 className="text-xl font-bold text-taja-secondary">{group.title}</h3>
                </div>
                <Link href="/marketplace">
                  <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest">
                    View All
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {group.products.slice(0, 4).map((product, idx) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link href={`/product/${product.slug}`} className="group block">
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 mb-3">
                        <Image
                          src={product.images?.[0] || "/placeholder.jpg"}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />

                        {/* AI Badge for personalized */}
                        {group.type === 'personalized' && (
                          <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-taja-primary flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            For You
                          </div>
                        )}

                        {/* Trending Badge */}
                        {group.type === 'trending' && product.soldCount && product.soldCount > 10 && (
                          <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-white">
                            Hot
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm text-taja-secondary line-clamp-2 group-hover:text-taja-primary transition-colors">
                          {product.title}
                        </h4>

                        <div className="text-lg font-bold text-taja-secondary">
                          {product.maxPrice && product.maxPrice > product.price
                            ? `${formatCurrency(product.price)} - ${formatCurrency(product.maxPrice)}`
                            : formatCurrency(product.price)
                          }
                        </div>

                        {product.shop && (
                          <p className="text-xs text-gray-400">
                            by {product.shop.shopName}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
