"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Search, ArrowRight, Grid, LayoutGrid, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useWishlistStore } from "@/components/wishlist";
import { ProductCard } from "@/components/product/ProductCard";
import { useCartStore } from "@/stores/cartStore";
import toast from "react-hot-toast";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function WishlistPage() {
  const { items: wishlistItems, isLoading, hasLoaded, fetchWishlist, removeItem } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (!hasLoaded) {
      fetchWishlist();
    }
  }, [hasLoaded, fetchWishlist]);

  const handleMoveAllToCart = () => {
    if (wishlistItems.length === 0) return;

    wishlistItems.forEach(item => {
      addToCart({
        _id: item._id,
        title: item.title,
        price: item.price,
        images: item.images,
        seller: (item as any).seller || "unknown",
        moq: (item as any).moq || 1,
        stock: (item as any).stock ?? 999,
        shopSlug: item.shop?.shopSlug || item.slug,
      });
      removeItem(item._id);
    });

    toast.success("All items moved to cart!", {
      style: {
        borderRadius: '1rem',
        background: '#000',
        color: '#fff',
      }
    });
  };

  const sortedItems = [...wishlistItems].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    return 0; // default/newest (assuming storage order is newest first)
  });

  const filteredItems = sortedItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.shop?.shopName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-32">
      {/* Premium Cinematic Hero Header - Light Mode */}
      <div className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden border-b border-gray-100/50">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#FDFDFD]"></div>
          {/* Custom Noise Pattern for subtle texture */}
          <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/db2fcni0k/image/upload/v1771783815/noise_hq9z5n.png')] opacity-[0.03] mix-blend-multiply"></div>

          {/* Dynamic Floating Gradient Shapes - Subtler for Light Mode */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -left-1/4 w-[70%] h-[120%] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[120%] bg-rose-400/10 rounded-full blur-[160px] pointer-events-none"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="max-w-3xl space-y-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center rounded-full bg-taja-primary/5 px-4 py-2 border border-taja-primary/10 shadow-sm"
              >
                <Heart className="h-3 w-3 text-rose-500 fill-rose-500 mr-2" />
                <span className="text-[9px] font-black text-rose-600 uppercase tracking-[0.25em]">Personal Vault</span>
              </motion.div>

              <div className="space-y-2 md:space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl xs:text-5xl md:text-7xl lg:text-8xl font-black text-taja-secondary tracking-tighter leading-[0.95] md:leading-[0.9]"
                >
                  Your <span className="text-transparent bg-clip-text bg-gradient-taja">Wishlist</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-500 text-base md:text-xl font-medium max-w-xl leading-relaxed"
                >
                  Curate your ideal collection from the best of Taja marketplace.
                </motion.p>
              </div>
            </div>

            {/* Responsive Premium Controls - Optimized for Light Mode */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full lg:w-auto flex flex-col gap-3 sm:gap-4"
            >
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Filter your saves..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full lg:min-w-[360px] pl-12 pr-6 py-4 bg-white border border-gray-100 text-taja-secondary placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-taja-primary/20 focus:border-taja-primary/30 transition-all shadow-premium font-bold text-xs"
                />
              </div>

              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full">
                <div className="relative flex-1 xs:flex-none">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-gray-100 text-taja-secondary/70 text-[10px] font-black uppercase tracking-[0.2em] pl-4 pr-10 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-taja-primary/10 transition-all appearance-none cursor-pointer shadow-premium"
                  >
                    <option value="newest" className="bg-white">Recently Saved</option>
                    <option value="price_asc" className="bg-white">Price: Low to High</option>
                    <option value="price_desc" className="bg-white">Price: High to Low</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                </div>

                {wishlistItems.length > 0 && (
                  <Button
                    onClick={handleMoveAllToCart}
                    className="flex-1 h-[48px] rounded-2xl bg-taja-primary hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-6 shadow-xl shadow-emerald-900/40 group"
                  >
                    Move All to Bag
                    <ArrowRight className="ml-2 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Global Mask for smooth transition to white bg */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#FDFDFD] via-[#FDFDFD]/80 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 -mt-4 relative z-20">
        {/* Loading Skeleton */}
        {isLoading && !hasLoaded ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-[2rem] h-[320px] md:h-[400px] animate-pulse border border-slate-100 shadow-sm" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-10">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center bg-white rounded-xl md:rounded-2xl shadow-premium text-taja-secondary border border-gray-100 relative group">
                  <LayoutGrid className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-none">{filteredItems.length} Favorite{filteredItems.length !== 1 ? 's' : ''}</h3>
                  <p className="text-[9px] font-black text-taja-primary uppercase tracking-[0.25em] mt-1.5">Collection Ready</p>
                </div>
              </div>
            </div>

            <motion.div
              layout
              className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6 md:gap-8 lg:gap-10"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => {
                  const mappedProduct: Product = {
                    _id: item._id,
                    title: item.title,
                    price: item.price,
                    images: item.images,
                    slug: item.slug,
                    description: "",
                    category: "General",
                    condition: (item as any).condition || "new",
                    stock: item.inventory?.quantity ?? (item as any).stock ?? 999,
                    seller: "seller_id",
                    shop: {
                      _id: "shop_id",
                      shopName: item.shop?.shopName || "Elite Shop",
                      shopSlug: item.shop?.shopSlug || item.slug,
                      owner: "owner",
                    },
                    shopSlug: item.shop?.shopSlug || item.slug,
                  };

                  return (
                    <motion.div
                      layout
                      key={item._id}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, rotate: -2 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    >
                      <ProductCard
                        product={mappedProduct}
                        showWishlist={true}
                        className="!rounded-[1.75rem] md:!rounded-[2.25rem] !shadow-premium hover:!shadow-huge transition-all duration-500 overflow-hidden"
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>
        ) : (
          /* Enhanced Cinematic Empty State */
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 md:py-32 flex flex-col items-center justify-center max-w-lg mx-auto text-center px-4"
          >
            <div className="relative mb-8 md:mb-12">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-emerald-100 blur-[60px] md:blur-[100px] rounded-full"
              />
              <div className="h-40 w-40 md:h-56 md:w-56 bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex items-center justify-center relative transform -rotate-1 border border-gray-50 overflow-hidden">
                <Heart className="h-20 w-20 md:h-28 md:w-28 text-emerald-50 fill-current" />
                <Heart className="h-16 w-16 md:h-20 md:w-20 text-emerald-500 fill-current absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-xl z-20" />
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-taja-secondary leading-[1.1]">
                {searchTerm ? "No Matches Found" : "Your Vault is Empty"}
              </h3>
              <p className="text-gray-400 font-medium text-base md:text-lg leading-relaxed px-4 md:px-0">
                {searchTerm
                  ? "We couldn't find any products in your wishlist matching your search."
                  : "Tap the heart on any product to save it here for later. Your future favorites are waiting!"}
              </p>
            </div>

            <div className="pt-8 w-full xs:w-auto">
              <Link href="/marketplace">
                <Button className="w-full px-10 h-14 md:h-16 rounded-full bg-taja-secondary text-white hover:bg-black shadow-huge hover:scale-[1.02] transition-all group overflow-hidden relative">
                  <span className="relative z-10 font-black uppercase tracking-[0.25em] text-[10px]">Back to Marketplace</span>
                  <ArrowRight className="relative z-10 ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-taja-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}