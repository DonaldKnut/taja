"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tag,
  Plus,
  Loader2,
  Layers,
  Package,
  ArrowLeft,
  Sparkles,
  Hash,
  Search,
  FolderTree,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
  isActive?: boolean;
  sortOrder?: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    parent: "",
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api("/api/categories");
      if (res?.success && Array.isArray(res?.data)) {
        setCategories(res.data);
      }
    } catch (e) {
      toast.error("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          parent: form.parent || undefined,
        }),
      });
      if (res?.success) {
        toast.success("Category created successfully");
        setForm({ name: "", description: "", parent: "" });
        await fetchCategories();
      } else {
        toast.error(res?.message || "Failed to create category");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await api(`/api/categories/${id}`, {
        method: "DELETE",
      });
      if (res?.success) {
        toast.success("Category deleted successfully");
        await fetchCategories();
      } else {
        toast.error(res?.message || "Failed to delete category");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete category");
    }
  };

  const filtered = search.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount ?? 0), 0);

  return (
    <div className="min-h-screen bg-motif-blanc selection:bg-taja-primary/30">
      {/* ── Sticky Action Bar ── */}
      <nav className="sticky top-0 z-40 border-b border-taja-primary/10 bg-white/10 backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-10">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-6">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-taja-secondary/60 hover:text-taja-primary transition-all group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Link>
            </div>
            <Link href="/admin/products/new">
              <button className="flex items-center gap-3 px-8 py-3 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-premium hover:shadow-premium-hover hover:bg-emerald-600 hover:-translate-y-0.5 transition-all">
                <Package className="h-4 w-4 text-emerald-400" />
                Add Product
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <motion.div
        initial="hidden"
        animate="show"
        variants={container}
        className="max-w-[1200px] mx-auto px-4 sm:px-10 py-12"
      >
        {/* Header */}
        <motion.div variants={item} className="mb-12">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-[1.2rem] bg-slate-950 shadow-lg flex items-center justify-center">
              <Tag className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Catalog</h3>
              <h1 className="text-4xl font-black text-taja-secondary tracking-tighter italic">Categories</h1>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
          {[
            { label: "Total Categories", value: categories.length, color: "text-taja-primary" },
            { label: "Products Assigned", value: totalProducts, color: "text-emerald-600" },
            { label: "Top-Level", value: categories.filter((c) => !c.slug.includes("/")).length, color: "text-blue-600" },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel p-6 border-white/60 rounded-[24px]">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
              <p className={`text-3xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ── Create Category Form ── */}
          <motion.div variants={item} className="lg:col-span-4">
            <div className="glass-panel p-8 border-white/60 rounded-[32px] relative overflow-hidden sticky top-28">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full -z-10" />

              <div className="space-y-1 mb-8">
                <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">New Entry</h3>
                <p className="text-2xl font-black text-taja-secondary tracking-tighter italic">Create Category</p>
              </div>

              <p className="text-[10px] font-bold text-gray-400 leading-relaxed mb-8">
                New categories will appear in the <strong className="text-taja-secondary">Category</strong> dropdown when adding products.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-bold text-taja-secondary placeholder:text-gray-300"
                    placeholder="e.g., Fashion & Clothing"
                  />
                </div>

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description (optional)"
                    rows={2}
                    className="w-full p-4 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-medium text-taja-secondary placeholder:text-gray-300 resize-none"
                  />
                </div>

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Parent Category
                  </label>
                  <select
                    value={form.parent}
                    onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
                    className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] text-taja-secondary appearance-none"
                  >
                    <option value="">None — top-level</option>
                    {categories.filter((c) => !c.slug.includes("/")).map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !form.name.trim()}
                  className="w-full flex items-center justify-center gap-3 h-14 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-premium hover:shadow-premium-hover hover:bg-emerald-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-emerald-400" />}
                  Create Category
                </button>
              </form>
            </div>
          </motion.div>

          {/* ── Category List ── */}
          <motion.div variants={item} className="lg:col-span-8">
            <div className="glass-panel border-white/60 rounded-[32px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -z-10" />

              {/* List Header */}
              <div className="p-8 pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Directory</h3>
                    <p className="text-2xl font-black text-taja-secondary tracking-tighter italic">All Categories</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full sm:w-64 h-12 pl-11 pr-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-bold text-taja-secondary placeholder:text-gray-300"
                      placeholder="Search categories…"
                    />
                  </div>
                </div>
              </div>

              {/* List Content */}
              <div className="px-8 pb-8">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-taja-primary/40" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 rounded-[20px] bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Tag className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-sm font-black text-taja-secondary mb-1">
                      {search ? "No matching categories" : "No categories yet"}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400">
                      {search ? "Try a different search term." : "Create your first category using the form."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((cat, index) => (
                      <motion.div
                        key={cat._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.3 }}
                        className="group flex items-center justify-between glass-card border-white/60 rounded-2xl px-6 py-5 hover:bg-white hover:border-taja-primary/20 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-taja-primary/10 flex items-center justify-center shrink-0 group-hover:from-emerald-500/20 group-hover:to-taja-primary/20 transition-colors">
                            <Hash className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-taja-secondary tracking-tight truncate group-hover:text-taja-primary transition-colors">
                              {cat.name}
                            </p>
                            <p className="text-[10px] font-mono font-bold text-gray-400 truncate">
                              {cat.slug}
                            </p>
                            {cat.description && (
                              <p className="text-[10px] font-medium text-gray-400 mt-0.5 line-clamp-1">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 px-3 py-1.5 glass-card border-white/60 rounded-xl shrink-0">
                            <Package className="h-3 w-3 text-taja-primary/60" />
                            <span className="text-[10px] font-black text-taja-secondary uppercase tracking-widest whitespace-nowrap">
                              {cat.productCount ?? 0}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDelete(cat._id, cat.name)}
                            className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
                            title="Delete Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
