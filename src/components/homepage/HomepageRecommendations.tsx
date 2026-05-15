"use client";

import Link from "next/link";
import { CachedProductImage } from "@/components/media/CachedProductImage";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Package, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getProductDisplayPriceRange } from "@/lib/productPricing";
import { Button } from "@/components/ui/Button";
import { getProductPath } from "@/lib/productLinks";
import { PRODUCT_IMAGE_PLACEHOLDER_URL } from "@/lib/brandAssets";
import { useHomepageRecommendations } from "@/hooks/useHomepageRecommendations";

const GROUP_ICONS = {
  sparkles: <Sparkles className="h-5 w-5" />,
  trending: <TrendingUp className="h-5 w-5" />,
  package: <Package className="h-5 w-5" />,
} as const;

export function HomepageRecommendations() {
  const { groups, loading, error } = useHomepageRecommendations();

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="flex items-center justify-center gap-2 text-gray-400"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading recommendations...</span>
          </motion.div>
        </motion.div>
      </section>
    );
  }

  if (error || groups.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-taja-primary/10 border border-taja-primary/20 mb-6"
          >
            <Sparkles className="h-4 w-4 text-taja-primary" />
            <span className="text-[10px] font-black text-taja-primary uppercase tracking-widest">AI-Powered</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-taja-secondary tracking-tight mb-4">
            Curated Just For You
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Discover products tailored to your style and preferences, powered by our intelligent recommendation engine.
          </p>
        </div>

        <motion.div
          className="space-y-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {groups.map((group) => (
            <motion.div
              key={group.type}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
              }}
            >
              <motion.div
                className="flex items-center justify-between mb-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-taja-primary/10 rounded-xl text-taja-primary">
                    {GROUP_ICONS[group.iconKey]}
                  </div>
                  <h3 className="text-xl font-bold text-taja-secondary">{group.title}</h3>
                </div>
                <Link href="/marketplace">
                  <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest">
                    View All
                  </Button>
                </Link>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {group.products.slice(0, 4).map((product, idx) => {
                  const { minPrice, maxPrice } = getProductDisplayPriceRange(product);
                  const priceLabel =
                    maxPrice !== undefined && maxPrice > minPrice
                      ? `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
                      : formatCurrency(minPrice);
                  return (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.06, duration: 0.3 }}
                    >
                      <Link href={getProductPath(product as Parameters<typeof getProductPath>[0])} className="group block">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 mb-3">
                          <CachedProductImage
                            src={product.images?.[0] || PRODUCT_IMAGE_PLACEHOLDER_URL}
                            alt={product.title}
                            shouldLoad
                            priority={idx < 2}
                            className="transition-transform duration-500 group-hover:scale-105"
                          />

                          {group.type === "personalized" && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.15 }}
                              className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-taja-primary flex items-center gap-1"
                            >
                              <Sparkles className="h-3 w-3" />
                              For You
                            </motion.div>
                          )}

                          {group.type === "trending" && product.soldCount && product.soldCount > 10 && (
                            <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-white">
                              Hot
                            </div>
                          )}
                        </div>

                        <motion.div
                          className="space-y-1"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 + idx * 0.05 }}
                        >
                          <h4 className="font-semibold text-sm text-taja-secondary line-clamp-2 group-hover:text-taja-primary transition-colors">
                            {product.title}
                          </h4>

                          <motion.div
                            className="text-lg font-bold text-taja-secondary"
                            initial={{ opacity: 0, y: 4 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.12 + idx * 0.05 }}
                          >
                            {priceLabel}
                          </motion.div>

                          {product.shop && (
                            <p className="text-xs text-gray-400">by {product.shop.shopName}</p>
                          )}
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
