"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, Zap, Gift, Tag, Star, ChevronRight, ShoppingBag, ShieldCheck, Crown, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/product";
import { useMarketplaceFeed } from "@/hooks/useMarketplaceFeed";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { CartIcon } from "@/components/cart/CartIcon";

// Sliding background images for the header
const HEADER_IMAGES = [
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788747/taja_slider_two_xairfb.png",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788744/fresh-fish-lying-on-ice-displayed-at-market-stall-photo_z9hesn.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788740/jewellery-market-display-expensive-gold-W4Y9X5_njruyv.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788743/taja_slider_one_uejcaa.png",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788739/5b9b40227abe24427953fd15_1536901154609_hltbyr.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788740/close-up-japanese-street-food_23-2149287841_vlqufi.avif",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788741/cj-best-deal-nigeria_mh1xhd.webp",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788740/images_3_dwjrfw.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788739/images_2_ayogjf.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788740/Ankara-Fabric.-Photo-Jiji_drf9hb.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788741/Central_Car_Auctions_Glasgow_620-620x330_xgvcuw.jpg",
    "https://res.cloudinary.com/db2fcni0k/image/upload/v1772788740/1742419884817_v7haqx.jpg"
];

export interface IntegratedMarketplaceProps {
    isInsideDashboard?: boolean;
}

export function IntegratedMarketplace({ isInsideDashboard = false }: IntegratedMarketplaceProps) {
    const searchParams = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedTab, setSelectedTab] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [shopQuery, setShopQuery] = useState("");
    const [sellerQuery, setSellerQuery] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showVerifiedIntro, setShowVerifiedIntro] = useState(false);
    const [headerIndex, setHeaderIndex] = useState(0);

    const { user } = useAuth();
    const firstName = user?.fullName?.split(" ")[0] || "Shopper";

    const feed = useMarketplaceFeed({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        shop: shopQuery || undefined,
        seller: sellerQuery || undefined,
        location: locationQuery || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        verifiedOnly,
    });

    const availableShops = useMemo(() => {
        const seen = new Set<string>();
        const shops: string[] = [];
        feed.products.forEach((product) => {
            const shopName = typeof product.shop === "object" ? product.shop?.shopName : "";
            if (shopName && !seen.has(shopName.toLowerCase())) {
                seen.add(shopName.toLowerCase());
                shops.push(shopName);
            }
        });
        return shops.sort((a, b) => a.localeCompare(b));
    }, [feed.products]);

    const availableSellers = useMemo(() => {
        const seen = new Set<string>();
        const sellers: string[] = [];
        feed.products.forEach((product) => {
            const sellerName = typeof product.seller === "object" ? product.seller?.fullName : "";
            if (sellerName && !seen.has(sellerName.toLowerCase())) {
                seen.add(sellerName.toLowerCase());
                sellers.push(sellerName);
            }
        });
        return sellers.sort((a, b) => a.localeCompare(b));
    }, [feed.products]);

    const hasAdvancedFilters = Boolean(
        selectedCategory || shopQuery || sellerQuery || locationQuery || minPrice || maxPrice || verifiedOnly
    );

    const availableLocations = useMemo(() => {
        const seen = new Set<string>();
        const locations: string[] = [];
        feed.products.forEach((product) => {
            const raw = product.location?.trim();
            if (!raw) return;
            const key = raw.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                locations.push(raw);
            }
        });
        return locations.sort((a, b) => a.localeCompare(b));
    }, [feed.products]);

    const displayedProducts = useMemo(() => {
        let prods = feed.products;
        if (selectedTab === "Promo") return prods.filter(p => (p.compareAtPrice ?? 0) > p.price);
        if (selectedTab === "Best Deals") return prods.slice(0, 4);
        return prods;
    }, [feed.products, selectedTab]);

    const clearAdvancedFilters = () => {
        setSelectedCategory("");
        setShopQuery("");
        setSellerQuery("");
        setLocationQuery("");
        setMinPrice("");
        setMaxPrice("");
        setVerifiedOnly(false);
    };

    // Decide intro visibility only after mount to avoid SSR/client mismatch.
    useEffect(() => {
        if (isInsideDashboard || typeof window === "undefined") {
            setShowVerifiedIntro(false);
            return;
        }
        setShowVerifiedIntro(!sessionStorage.getItem("taja_intro_played"));
    }, [isInsideDashboard]);

    // Intro timer
    useEffect(() => {
        if (showVerifiedIntro) {
            const timer = setTimeout(() => {
                setShowVerifiedIntro(false);
                sessionStorage.setItem("taja_intro_played", "true");
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [showVerifiedIntro]);

    // Header image slider timer
    useEffect(() => {
        const timer = setInterval(() => {
            setHeaderIndex((prev) => (prev + 1) % HEADER_IMAGES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const urlSearch = searchParams.get("search");
    useEffect(() => {
        if (urlSearch == null) return;
        setSearchQuery(urlSearch);
    }, [urlSearch]);

    return (
        <div className={cn(
            "bg-[#F8F9FB] min-h-screen overflow-hidden",
            isInsideDashboard ? "pb-12" : "pb-24"
        )}>
            <AnimatePresence mode="wait">
                {showVerifiedIntro && !isInsideDashboard ? (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                        transition={{ duration: 0.8 }}
                        className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mx-auto w-24 h-24 rounded-[2rem] bg-taja-light flex items-center justify-center mb-8 ring-8 ring-taja-primary/5 shadow-premium"
                        >
                            <ShieldCheck className="w-12 h-12 text-taja-primary" />
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4"
                        >
                            <h2 className="text-sm font-black text-taja-primary uppercase tracking-[0.4em]">Establish Trust</h2>
                            <h1 className="text-4xl md:text-6xl font-black text-taja-secondary tracking-tighter leading-none">
                                Redefining <br /> <span className="text-transparent bg-clip-text bg-gradient-taja">Trust.</span>
                            </h1>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-col items-center justify-center gap-3 pt-12 px-4 text-center max-w-md mx-auto"
                        >
                            <p className="text-xl font-black text-taja-secondary tracking-tight leading-tight">
                                Shop with confidence
                            </p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                                Secure checkout · Real sellers · Buyer protection
                            </p>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="main"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full"
                    >
                        {/* ═══ Sliding Media Header ═══ */}
                        {/* ═══ Header Registry Search ═══ */}
                        <section
                            className={cn(
                                "px-4 sm:px-6 border-b border-gray-100 shadow-sm",
                                "bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80",
                                "pt-0 pb-4 sm:pb-5 md:pb-4"
                            )}
                        >
                            <div className="space-y-4">
                                {!isInsideDashboard && (
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.22em] leading-none">All products</p>
                                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Hello, {firstName} 👋</h2>
                                        </div>
                                        <div className="md:hidden">
                                            <CartIcon
                                                className="w-12 h-12 bg-taja-light/30 backdrop-blur-2xl border border-taja-primary/10 rounded-[1.2rem] text-taja-primary shadow-sm active:scale-95 transition-all"
                                                iconSize="h-5 w-5"
                                                badgeClassName="bg-taja-primary text-white border-2 border-white !h-4 !w-4 !text-[9px] !-top-1 !-right-1"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-emerald-950 min-h-[120px] sm:min-h-[140px]">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={HEADER_IMAGES[headerIndex]}
                                            initial={{ opacity: 0, x: 24, scale: 1.04 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -24, scale: 1.02 }}
                                            transition={{ duration: 0.55, ease: "easeOut" }}
                                            className="absolute inset-0"
                                        >
                                            <Image
                                                src={HEADER_IMAGES[headerIndex]}
                                                alt="Marketplace promotion"
                                                fill
                                                className="object-cover opacity-60"
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900/85 to-emerald-900/40" />
                                    <div className="relative z-10 p-5 sm:p-6 text-white max-w-sm">
                                        <p className="text-xl sm:text-2xl font-black leading-tight">Get free delivery on shopping over $200</p>
                                        <button
                                            type="button"
                                            className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white text-emerald-900 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Learn more
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-[1fr_auto_auto] gap-3">
                                    <div className="relative col-span-2 md:col-span-1">
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 pr-10 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-taja-primary/20 appearance-none"
                                        >
                                            <option value="">All Categories</option>
                                            {(feed.categories || []).map((category) => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={selectedTab}
                                            onChange={(e) => setSelectedTab(e.target.value)}
                                            className="w-full md:w-[140px] h-12 rounded-2xl border border-gray-200 bg-white px-4 pr-10 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-taja-primary/20 appearance-none"
                                        >
                                            <option value="All">Sort: All</option>
                                            <option value="Promo">Sort: Promo</option>
                                            <option value="Best Deals">Sort: Best Deals</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowAdvancedFilters((prev) => !prev)}
                                        className={cn(
                                            "h-12 px-4 inline-flex items-center justify-center gap-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm",
                                            showAdvancedFilters || hasAdvancedFilters
                                                ? "text-taja-primary bg-taja-light/40 border-taja-primary/25"
                                                : "text-gray-600 bg-white border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        <Filter className="w-4 h-4" />
                                        Filters
                                        <ChevronDown className={cn("w-3 h-3 transition-transform", showAdvancedFilters && "rotate-180")} />
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence initial={false}>
                                {showAdvancedFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: -4 }}
                                        animate={{ opacity: 1, height: "auto", y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -4 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-4 rounded-3xl border border-gray-200 bg-gray-50/70 p-4 md:p-5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <SlidersHorizontal className="w-4 h-4 text-taja-primary" />
                                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-700">Advanced Filters</h4>
                                                </div>
                                                {hasAdvancedFilters && (
                                                    <button
                                                        type="button"
                                                        onClick={clearAdvancedFilters}
                                                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-800"
                                                    >
                                                        <X className="w-3 h-3" />
                                                        Clear
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                                                <select
                                                    value={selectedCategory}
                                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                                >
                                                    <option value="">All Categories</option>
                                                    {(feed.categories || []).map((category) => (
                                                        <option key={category} value={category}>{category}</option>
                                                    ))}
                                                </select>

                                                <input
                                                    type="text"
                                                    list="marketplace-shops-list"
                                                    value={shopQuery}
                                                    onChange={(e) => setShopQuery(e.target.value)}
                                                    placeholder="Filter by shop"
                                                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                                />
                                                <datalist id="marketplace-shops-list">
                                                    {availableShops.map((shop) => (
                                                        <option key={shop} value={shop} />
                                                    ))}
                                                </datalist>

                                                <input
                                                    type="text"
                                                    list="marketplace-sellers-list"
                                                    value={sellerQuery}
                                                    onChange={(e) => setSellerQuery(e.target.value)}
                                                    placeholder="Filter by seller"
                                                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                                />
                                                <datalist id="marketplace-sellers-list">
                                                    {availableSellers.map((sellerName) => (
                                                        <option key={sellerName} value={sellerName} />
                                                    ))}
                                                </datalist>

                                                <input
                                                    type="text"
                                                    list="marketplace-locations-list"
                                                    value={locationQuery}
                                                    onChange={(e) => setLocationQuery(e.target.value)}
                                                    placeholder="Filter by location"
                                                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                                />
                                                <datalist id="marketplace-locations-list">
                                                    {availableLocations.map((location) => (
                                                        <option key={location} value={location} />
                                                    ))}
                                                </datalist>

                                                <label className="h-11 rounded-xl border border-gray-200 bg-white px-3 flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={verifiedOnly}
                                                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                                                        className="h-4 w-4 rounded border-gray-300 text-taja-primary focus:ring-taja-primary/30"
                                                    />
                                                    <span className="text-sm font-semibold text-gray-700">Verified shops only</span>
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={minPrice}
                                                    onChange={(e) => setMinPrice(e.target.value)}
                                                    placeholder="Minimum price (₦)"
                                                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                                />
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={maxPrice}
                                                    onChange={(e) => setMaxPrice(e.target.value)}
                                                    placeholder="Maximum price (₦)"
                                                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>

                        {/* ═══ Product Feed ═══ */}
                        <section className="px-4 sm:px-6 space-y-8 mt-3 sm:mt-5 pb-20">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic">Product Catalog</h3>
                                <div className="flex gap-2">
                                    {["All", "Promo", "Best Deals"].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setSelectedTab(tab)}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                                selectedTab === tab ? "bg-black text-white shadow-xl scale-105" : "text-gray-400 hover:text-black"
                                            )}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Grid Layout - 2 columns on mobile */}
                            <AnimatePresence mode="popLayout">
                                {feed.loading ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="bg-white animate-pulse rounded-[2.5rem] h-72 border border-gray-100 shadow-sm" />
                                        ))}
                                    </div>
                                ) : displayedProducts.length > 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 md:gap-6 px-1"
                                    >
                                        {displayedProducts.map((product) => (
                                            <ProductCard
                                                key={product._id}
                                                product={product}
                                                isInsideDashboard={isInsideDashboard}
                                                showSellerRow
                                            />
                                        ))}
                                    </motion.div>
                                ) : (
                                    <div className="bg-white/50 backdrop-blur-md rounded-[3rem] p-20 text-center border-dashed border-2 border-gray-200">
                                        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">No products found here yet</p>
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* Load More Action */}
                            <div className="pt-10 flex justify-center pb-20">
                                <button
                                    onClick={() => feed.refetch()}
                                    className="px-12 h-18 bg-white border border-gray-100 rounded-full shadow-premium flex items-center justify-center gap-4 group hover:shadow-xl transition-all active:scale-95"
                                >
                                    {feed.loading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
                                    ) : (
                                        <>
                                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-900">Load More Products</span>
                                            <ChevronRight className="w-5 h-5 text-taja-primary group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </section>

                        {/* ═══ Curated Brands ═══ */}
                        <section className="px-4 sm:px-6 py-4 pt-10 border-t border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <Crown className="w-5 h-5 text-taja-primary" />
                                <h3 className="text-lg font-black text-gray-900 tracking-tighter uppercase italic">Featured Shops</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-6 px-1 pb-6">
                                {(feed.recommendedShops && feed.recommendedShops.length > 0 ? feed.recommendedShops : []).map((shop) => (
                                    <Link
                                        key={shop._id}
                                        href={`/shop/${shop.shopSlug}`}
                                        className="flex flex-col items-center gap-3 group"
                                    >
                                        <div className="w-full aspect-square bg-white rounded-[1.5rem] flex items-center justify-center shadow-premium border border-gray-50 transition-all group-hover:shadow-xl group-hover:-translate-y-1 overflow-hidden relative p-4">
                                            {shop.logo ? (
                                                <img
                                                    src={shop.logo}
                                                    alt={shop.shopName}
                                                    className="w-full h-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
                                                    <ShoppingBag className="w-6 h-6 text-gray-200" />
                                                </div>
                                            )}
                                            {shop.isVerified && (
                                                <div className="absolute top-2 right-2 w-5 h-5 bg-taja-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                                    <ShieldCheck className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-[10px] font-black text-gray-900 uppercase tracking-widest group-hover:text-taja-primary transition-colors truncate w-full px-2">
                                                {shop.shopName}
                                            </span>
                                            <div className="flex items-center justify-center gap-1 mt-0.5">
                                                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                                <span className="text-[8px] font-black text-gray-400">{shop.averageRating || "5.0"}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* ═══ Promotional Experience Section (Moved Below Products) ═══ */}
                        {!isInsideDashboard && (
                            <section className="relative px-6 py-20 bg-black mt-20">
                                {/* Sliding Background Images */}
                                <div className="absolute inset-0 z-0">
                                    <AnimatePresence mode="popLayout">
                                        <motion.div
                                            key={headerIndex}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.4 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 2 }}
                                            className="absolute inset-0"
                                        >
                                            <Image
                                                src={HEADER_IMAGES[headerIndex]}
                                                alt="Promo Background"
                                                fill
                                                className="object-cover saturate-0"
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                                    <div className="absolute inset-0 motif-blanc opacity-[0.03]" />
                                </div>

                                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-taja-primary uppercase tracking-[0.4em]">The Taja Experience</h3>
                                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight italic">
                                            Curated Collections <br /> & Premium Finds.
                                        </h2>
                                    </div>

                                    {/* Quick Icon Links - In a more prominent promotional grid */}
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-8">
                                        {[
                                            { label: "GreatBuy", icon: ShoppingBag, color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
                                            { label: "Flash", icon: Zap, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
                                            { label: "Gift", icon: Gift, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
                                            { label: "Coupon", icon: Tag, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
                                            { label: "VIPArea", icon: Star, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
                                        ].map((item) => (
                                            <div key={item.label} className="flex flex-col items-center gap-4 group cursor-pointer">
                                                <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 border backdrop-blur-xl shadow-2xl", item.color)}>
                                                    <item.icon className="w-8 h-8" />
                                                </div>
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-taja-primary transition-colors">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-8">
                                        <Button
                                            variant="outline"
                                            className="rounded-full px-10 border-white/20 text-white hover:bg-white hover:text-black transition-all"
                                        >
                                            Explore Curated Collections
                                        </Button>
                                    </div>
                                </div>
                            </section>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
