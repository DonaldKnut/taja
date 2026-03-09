"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Search, ArrowRight, Grid, LayoutGrid } from "lucide-react";
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
    <div className="min-h-screen bg-[#FDFDFD] pb-24">
      {/* Premium Cinematic Hero Header */}
      <div className="relative pt-32 pb-24 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#0A0A0B]"></div>
          {/* Custom Noise Pattern */}
          <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/db2fcni0k/image/upload/v1771783815/noise_hq9z5n.png')] opacity-[0.15] mix-blend-overlay"></div>

          {/* Dynamic Gradient Shapes */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -left-1/4 w-[60%] h-[120%] bg-rose-600/30 rounded-full blur-[140px] pointer-events-none"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[120%] bg-taja-primary/20 rounded-full blur-[140px] pointer-events-none"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="max-w-3xl space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center rounded-full bg-white/5 backdrop-blur-2xl px-5 py-2.5 border border-white/10 shadow-2xl"
              >
                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 mr-2.5" />
                <span className="text-[10px] font-black text-rose-100 uppercase tracking-[0.3em]">My Wishlist</span>
              </motion.div>

              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9]"
                >
                  My Saved <span className="text-transparent bg-clip-text bg-gradient-to-br from-rose-200 via-rose-400 to-rose-600">Items</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-400 text-lg md:text-xl font-medium max-w-xl leading-relaxed"
                >
                  Your personal collection of saved products and marketplace finds.
                </motion.p>
              </div>
            </div>

            {/* Premium Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full lg:w-auto space-y-4"
            >
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-500 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search your wishlist..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full lg:min-w-[400px] pl-14 pr-6 py-5 bg-white/5 backdrop-blur-3xl border border-white/10 text-white placeholder-slate-500 rounded-3xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-transparent transition-all shadow-2xl font-bold text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 lg:flex-none bg-white/5 border border-white/10 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-white/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="newest" className="bg-slate-900">Recently Saved</option>
                  <option value="price_asc" className="bg-slate-900">Price: Low to High</option>
                  <option value="price_desc" className="bg-slate-900">Price: High to Low</option>
                </select>

                {wishlistItems.length > 0 && (
                  <Button
                    onClick={handleMoveAllToCart}
                    className="flex-1 lg:flex-none h-[46px] rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-6 shadow-xl shadow-rose-900/20 group"
                  >
                    Move All to Bag
                    <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Cinematic Gradient Divider */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#FDFDFD] to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 -mt-10 relative z-20">
        {/* Content Area */}
        {isLoading && !hasLoaded ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-[2.5rem] h-[400px] animate-pulse border border-slate-100 shadow-premium" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 flex items-center justify-center bg-white rounded-2xl shadow-premium text-slate-900 border border-slate-50 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-taja-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <LayoutGrid className="h-5 w-5 relative z-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{filteredItems.length} Saved Items</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Your Favorites</p>
                </div>
              </div>
            </div>

            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 sm:gap-8"
            >
              <AnimatePresence>
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
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                      <ProductCard
                        product={mappedProduct}
                        showWishlist={true}
                        className="!shadow-premium hover:!shadow-huge transition-all duration-500"
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-32 flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-10"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-rose-500/10 blur-[80px] rounded-full group-hover:bg-rose-500/20 transition-all duration-700"></div>
              <div className="h-48 w-48 bg-white rounded-[3rem] shadow-huge flex items-center justify-center relative transform rotate-6 group-hover:rotate-12 transition-all duration-700 overflow-hidden border border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent" />
                <Heart className="h-20 w-20 text-rose-100 fill-current opacity-50 relative z-10" />
                <Heart className="h-20 w-20 text-rose-500 fill-current absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -ml-3 -mt-3 drop-shadow-[0_15px_30px_rgba(244,63,94,0.3)] z-20" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">
                {searchTerm ? "No Items Found" : "Your Wishlist is Empty"}
              </h3>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                {searchTerm
                  ? "We couldn't find any items matching your search. Try broadening your criteria."
                  : "Save your favorite products to find them easily later. Tap the heart icon on any product to save it here."}
              </p>
            </div>

            {!searchTerm && (
              <Link href="/marketplace">
                <Button className="h-16 px-12 rounded-[2rem] bg-slate-900 text-white hover:bg-black shadow-huge hover:scale-105 transition-all group overflow-hidden relative">
                  <span className="relative z-10 font-black uppercase tracking-[0.2em] text-[10px]">Start Shopping</span>
                  <ArrowRight className="relative z-10 ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-taja-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}