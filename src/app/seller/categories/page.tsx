"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Compass,
    Edit,
    Trash2,
    Sparkles,
    FolderPlus,
    Loader2,
    X,
    Tags
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";

interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    productCount: number;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function SellerCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: "", description: "" });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await api("/api/seller/categories");
            if (res?.success) {
                setCategories(res.data);
            }
        } catch (error) {
            console.error("Fetch categories error:", error);
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.name.trim()) return;

        setSubmitting(true);
        try {
            const res = await api("/api/seller/categories", {
                method: "POST",
                body: JSON.stringify(newCategory),
            });

            if (res?.success) {
                toast.success("Category created successfully");
                setCategories([res.data, ...categories]);
                setNewCategory({ name: "", description: "" });
                setIsAdding(false);
            }
        } catch (error: any) {
            toast.error(error?.message || "Failed to create category");
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-10 pb-20 px-4 sm:px-10 py-10"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col lg:flex-row justify-between items-end gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl md:text-5xl font-black text-taja-secondary tracking-tighter uppercase italic">
                            Product <span className="text-taja-primary">Categories</span>
                        </h1>
                    </div>
                    <p className="text-sm font-medium text-gray-500 tracking-wide">
                        Manage your store's taxonomy and organize your offerings.
                    </p>
                </div>

                <Button
                    onClick={() => setIsAdding(true)}
                    className="rounded-2xl px-8 h-12 text-[11px] font-black uppercase tracking-[0.2em] shadow-premium hover:shadow-premium-hover transition-all group"
                >
                    <Plus className="mr-3 h-4 w-4 group-hover:rotate-90 transition-transform" />
                    Add Category
                    <Sparkles className="ml-3 h-4 w-4 text-white/50" />
                </Button>
            </motion.div>

            {/* Stats/Quick Links (Optional aesthetic filler) */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-8 border-white/60 rounded-[32px] bg-white/40">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-taja-primary/10 text-taja-primary">
                            <Tags className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Categories</p>
                            <h3 className="text-2xl font-black text-taja-secondary">{categories.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-8 border-white/60 rounded-[32px] bg-white/40">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                            <Compass className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Global Coverage</p>
                            <h3 className="text-2xl font-black text-taja-secondary">100%</h3>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-8 border-white/60 rounded-[32px] bg-white/40">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">AI Optimized</p>
                            <h3 className="text-2xl font-black text-taja-secondary">Active</h3>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Control Filters */}
            <motion.div variants={item} className="glass-panel p-6 border-white/60 rounded-[32px]">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-taja-primary transition-colors" />
                    <Input
                        placeholder="Search Categories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-14 h-14 w-full glass-card border-white/60 focus:border-taja-primary/40 focus:ring-0 transition-all text-sm font-medium tracking-wide"
                    />
                </div>
            </motion.div>

            {/* Categories Grid */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-10 w-10 text-taja-primary animate-spin" />
                        <p className="text-[10px] font-black text-taja-primary uppercase tracking-widest">Synchronizing Taxonomy...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-24 border-white/60 text-center border-dashed rounded-[40px]"
                    >
                        <Compass className="h-20 w-20 text-taja-light/30 mx-auto mb-8" />
                        <h3 className="text-3xl font-black text-taja-secondary tracking-tight mb-4">No Categories found</h3>
                        <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">Add a category to help buyers find your products faster.</p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {filtered.map((category) => (
                            <motion.div
                                key={category._id}
                                variants={item}
                                className="glass-panel p-8 border-white/60 hover:shadow-premium group transition-all duration-500 rounded-[32px] flex flex-col relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-taja-primary/5 blur-3xl rounded-full -z-10 group-hover:bg-taja-primary/10 transition-colors" />
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 rounded-2xl bg-motif-blanc border border-white/60">
                                        <Compass className="h-6 w-6 text-taja-secondary" />
                                    </div>
                                    <span className="text-[10px] font-black text-taja-primary uppercase tracking-widest bg-taja-primary/5 px-3 py-1.5 rounded-full">
                                        {category.productCount} Products
                                    </span>
                                </div>
                                <h4 className="text-xl font-black text-taja-secondary mb-2 group-hover:text-taja-primary transition-colors">{category.name}</h4>
                                <p className="text-sm font-medium text-gray-500 line-clamp-2 mb-8">{category.description || "No description provided."}</p>
                                <div className="mt-auto pt-6 border-t border-white/40">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Slug: <span className="text-taja-secondary italic">{category.slug}</span></p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Category Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-taja-secondary/40 backdrop-blur-xl"
                            onClick={() => setIsAdding(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-xl glass-panel p-10 border-white rounded-[40px] shadow-huge"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Expansion</h3>
                                    <p className="text-3xl font-black text-taja-secondary tracking-tight italic">New Category</p>
                                </div>
                                <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-white/40 rounded-2xl transition-all">
                                    <X className="h-6 w-6 text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleAddCategory} className="space-y-8">
                                <div className="group space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                                        Category Name *
                                    </label>
                                    <input
                                        required
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                        className="w-full h-16 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-lg font-bold text-taja-secondary placeholder:text-gray-300"
                                        placeholder="e.g., Rare Collectibles"
                                    />
                                </div>

                                <div className="group space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                                        Description
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={newCategory.description}
                                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                        className="w-full p-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-3xl text-sm font-medium text-taja-secondary placeholder:text-gray-300 resize-none leading-relaxed"
                                        placeholder="Describe what belongs in this category..."
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={submitting || !newCategory.name.trim()}
                                    className="w-full h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-premium"
                                >
                                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FolderPlus className="mr-3 h-5 w-5" />}
                                    Deploy Category
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
