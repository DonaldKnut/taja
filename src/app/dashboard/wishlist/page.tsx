"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Search, ArrowRight, Grid, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useWishlistStore } from "@/components/wishlist";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

export default function WishlistPage() {
  const { items: wishlistItems, isLoading, hasLoaded, fetchWishlist } = useWishlistStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!hasLoaded) {
      fetchWishlist();
    }
  }, [hasLoaded, fetchWishlist]);

  const filteredItems = wishlistItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.shop?.shopName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Premium Cinematic Hero Header */}
      <div className="relative pt-24 pb-16 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black"></div>
          <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/db2fcni0k/image/upload/v1771783815/noise_hq9z5n.png')] opacity-10 mix-blend-overlay"></div>
          {/* Animated Glowing Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-taja-primary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-md px-4 py-2 border border-white/10 shadow-xl">
                <Heart className="h-4 w-4 text-rose-400 fill-current mr-2" />
                <span className="text-[10px] font-black text-rose-100 uppercase tracking-[0.2em]">Your Personal Vault</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.1]">
                Vision <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-200 to-rose-400">Board</span>
              </h1>
              <p className="text-slate-300 text-lg md:text-xl font-medium max-w-lg">
                Your highly curated collection of elite products and exquisite finds.
              </p>
            </div>

            {/* Search/Filter Bar */}
            <div className="w-full md:w-auto md:min-w-[320px]">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search your collection..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-slate-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-transparent transition-all shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Soft bottom fade to blend with background */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">

        {/* Stats Row */}
        {hasLoaded && wishlistItems.length > 0 && (
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-900 border border-gray-100">
                <LayoutGrid className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 tracking-tight">{filteredItems.length} Elite Items</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{searchTerm ? "Matching search" : "Currently saved"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {isLoading && !hasLoaded ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-[2rem] h-[360px] animate-pulse border border-gray-100 shadow-sm" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
            {filteredItems.map((item) => {
              // Map WishlistItem to Product type for ProductCard
              const mappedProduct: Product = {
                _id: item._id,
                title: item.title,
                price: item.price,
                images: item.images,
                slug: item.slug,
                description: "",
                category: "General",
                condition: (item as any).condition || "new",
                stock: item.inventory?.quantity ?? item.stock ?? 999,
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
                <ProductCard
                  key={mappedProduct._id}
                  product={mappedProduct}
                  showWishlist={true}
                  className="shadow-sm hover:shadow-xl transition-shadow"
                />
              );
            })}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full"></div>
              <div className="h-32 w-32 bg-white rounded-[2.5rem] shadow-premium flex items-center justify-center relative rotate-3 hover:rotate-6 transition-transform">
                <Heart className="h-12 w-12 text-rose-300 fill-current opacity-50" />
                <Heart className="h-12 w-12 text-rose-500 fill-current absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -ml-2 -mt-2 drop-shadow-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black tracking-tighter text-gray-900">
                {searchTerm ? "No matches found" : "Your Vault is Empty"}
              </h3>
              <p className="text-gray-500 font-medium">
                {searchTerm
                  ? "We couldn't find any items matching your search. Try different keywords."
                  : "Curate your own collection of elite marketplace items. Tap the heart icon on any product to save it here."}
              </p>
            </div>
            {!searchTerm && (
              <Button asChild className="h-14 px-8 rounded-2xl bg-black text-white hover:bg-slate-900 shadow-premium hover:shadow-premium-hover transition-all group mt-4">
                <Link href="/marketplace">
                  <span className="font-black uppercase tracking-widest text-xs">Explore Marketplace</span>
                  <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}