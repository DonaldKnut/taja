"use client";

import { useMemo, useState } from "react";
import { Search, Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/product";
import { useMarketplaceFeed } from "@/hooks/useMarketplaceFeed";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES } from "@/lib/constants/categories";

type ViewMode = "grid" | "list";

export function IntegratedMarketplace() {
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedCondition, setSelectedCondition] = useState<string>("");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    const { user } = useAuth();
    const feed = useMarketplaceFeed({
        category: selectedCategory || undefined,
    });

    const displayedProducts = useMemo(() => {
        if (!selectedCondition) return feed.products;
        return feed.products.filter((product) => product.condition === selectedCondition);
    }, [feed.products, selectedCondition]);

    return (
        <div className="space-y-10">
            {/* Dashboard View Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl md:text-5xl font-black text-taja-secondary tracking-tighter">
                            Marketplace <span className="text-taja-primary underline decoration-taja-primary/20 underline-offset-8">Feed</span>
                        </h1>
                    </div>
                    <p className="text-sm font-medium text-gray-500 tracking-wide flex items-center gap-2">
                        Curated feed for <span className="text-taja-secondary font-black uppercase tracking-widest text-[10px]">{user?.fullName || "Operator"}</span> • Secure Trade Enabled
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="glass-panel p-1 rounded-xl flex items-center gap-1 border-white/60 shadow-sm">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-taja-primary text-white shadow-premium" : "text-gray-400 hover:text-taja-secondary"}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-taja-primary text-white shadow-premium" : "text-gray-400 hover:text-taja-secondary"}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Category Quick Filter */}
            <section className="relative overflow-hidden">
                <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                    <button
                        onClick={() => setSelectedCategory("")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap border-2 font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${!selectedCategory
                            ? "bg-taja-primary border-taja-primary text-white shadow-premium scale-105"
                            : "bg-white border-white shadow-premium hover:border-taja-primary/40"
                            }`}
                    >
                        All Items
                    </button>
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.label;
                        return (
                            <button
                                key={cat.label}
                                onClick={() => setSelectedCategory(isSelected ? "" : cat.label)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-2xl whitespace-nowrap border-2 transition-all duration-300 ${isSelected
                                    ? "bg-taja-primary border-taja-primary text-white shadow-premium scale-105"
                                    : "bg-white border-white shadow-premium hover:border-taja-primary/40"
                                    }`}
                            >
                                <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-taja-primary"}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Filters & Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-1 border-white/60 shadow-sm bg-white/50">
                        <Filter className="w-3.5 h-3.5 text-taja-primary ml-3" />
                        <select
                            value={selectedCondition}
                            onChange={(e) => setSelectedCondition(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-taja-secondary focus:ring-0 cursor-pointer pr-8"
                        >
                            <option value="">Any Condition</option>
                            <option value="new">Pristine</option>
                            <option value="like-new">Near Mint</option>
                            <option value="good">Good</option>
                        </select>
                    </div>
                </div>

                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Displaying {displayedProducts.length} Premium products
                </div>
            </div>

            {/* Product Feed Grid */}
            <section className="relative min-h-[400px]">
                <AnimatePresence mode="popLayout">
                    {feed.loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="glass-card animate-pulse rounded-3xl p-4 border-white/60 space-y-4 shadow-premium">
                                    <div className="aspect-square bg-gray-50 rounded-2xl"></div>
                                    <div className="h-4 bg-gray-50 w-2/3 rounded-full"></div>
                                    <div className="h-3 bg-gray-50 w-1/3 rounded-full"></div>
                                </div>
                            ))}
                        </motion.div>
                    ) : displayedProducts.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`grid gap-8 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 max-w-4xl"}`}
                        >
                            {displayedProducts.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-panel rounded-[3rem] p-20 text-center border-white/60 border-dashed"
                        >
                            <div className="max-w-md mx-auto space-y-6">
                                <div className="h-20 w-20 rounded-full bg-taja-light flex items-center justify-center mx-auto mb-6">
                                    <Search className="w-8 h-8 text-taja-primary opacity-20" />
                                </div>
                                <h3 className="text-2xl font-black text-taja-secondary tracking-tight">No products found</h3>
                                <p className="text-gray-400 font-medium text-sm">Try adjusting your filters or check back later for new arrivals.</p>
                                <Button variant="outline" onClick={() => { setSelectedCategory(""); setSelectedCondition(""); }} className="rounded-full px-8">Clear Filters</Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Load More */}
            <div className="flex justify-center pt-10">
                <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-12 h-16 shadow-premium hover:shadow-premium-hover transition-all border-white/60"
                    onClick={() => feed.refetch()}
                >
                    {feed.loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-taja-primary border-t-transparent"></div>
                    ) : (
                        <span className="font-black uppercase tracking-widest text-[10px]">Load More Products</span>
                    )}
                </Button>
            </div>
        </div>
    );
}
