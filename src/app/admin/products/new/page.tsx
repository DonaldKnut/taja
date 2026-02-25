"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Loader2,
  Plus,
  Store,
  DollarSign,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Tag,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Shop {
  _id: string;
  shopName: string;
  shopSlug: string;
  owner?: { fullName: string; email: string };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function AdminProductsNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopIdFromUrl = useMemo(() => searchParams.get("shopId"), [searchParams]);
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    shopId: shopIdFromUrl || "",
    title: "",
    description: "",
    category: "",
    price: "",
    compareAtPrice: "",
    imageUrls: "",
    condition: "new",
    stock: "1",
    status: "active",
  });

  useEffect(() => {
    (async () => {
      try {
        const [shopsRes, catRes] = await Promise.all([
          api("/api/admin/shops"),
          api("/api/categories"),
        ]);
        if (shopsRes?.success && shopsRes?.data?.length) {
          setShops(shopsRes.data);
          if (shopIdFromUrl && shopsRes.data.some((s: Shop) => s._id === shopIdFromUrl)) {
            setForm((f) => ({ ...f, shopId: shopIdFromUrl }));
          }
        }
        if (catRes?.data?.length) setCategories(catRes.data);
      } catch (e) {
        toast.error("Failed to load shops or categories");
      }
    })();
  }, [shopIdFromUrl]);

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (!form.shopId || !form.title.trim() || !form.description.trim() || !form.category || !form.price.trim()) {
      toast.error("Fill required fields: Shop, Title, Description, Category, Price");
      return;
    }
    const images = form.imageUrls.trim() ? form.imageUrls.trim().split(/[\n\s]+/).filter(Boolean) : [];
    if (images.length === 0) {
      toast.error("Add at least one image URL");
      return;
    }
    setLoading(true);
    try {
      const res = await api("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          shopId: form.shopId,
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          price: parseFloat(form.price),
          compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
          images,
          condition: form.condition,
          stock: parseInt(form.stock) || 1,
          status: isDraft ? "draft" : form.status,
        }),
      });
      if (res?.success) {
        toast.success(isDraft ? "Draft saved" : "Product created");
        router.push("/admin/products");
      } else {
        toast.error(res?.message || "Failed to create product");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const hasRequiredFields =
    !!form.shopId && !!form.title.trim() && !!form.description.trim() && !!form.category && !!form.price.trim() && !!form.imageUrls.trim();

  const imageCount = form.imageUrls.trim() ? form.imageUrls.trim().split(/[\n\s]+/).filter(Boolean).length : 0;

  return (
    <div className="min-h-screen bg-motif-blanc selection:bg-taja-primary/30">
      {/* ── Sticky Action Bar ── */}
      <nav className="sticky top-0 z-40 border-b border-taja-primary/10 bg-white/10 backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-10">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-6">
              <Link
                href="/admin/products"
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-taja-secondary/60 hover:text-taja-primary transition-all group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Catalogue
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading || !hasRequiredFields}
                className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-taja-secondary/60 hover:text-taja-secondary hover:bg-white/40 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                Save Draft
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e)}
                disabled={loading || !hasRequiredFields}
                className="flex items-center gap-3 px-8 py-3 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-premium hover:shadow-premium-hover hover:bg-emerald-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-emerald-400" />}
                Publish Product
              </button>
            </div>
          </div>
        </div>
      </nav>

      <motion.div
        initial="hidden"
        animate="show"
        variants={container}
        className="max-w-[1200px] mx-auto px-4 sm:px-10 py-12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ── Main Form ── */}
          <div className="lg:col-span-8 space-y-12">

            {/* Assign to Shop */}
            <motion.section variants={item} className="glass-panel p-10 border-white/60 rounded-[40px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -z-10" />
              <div className="space-y-1 mb-10">
                <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Merchant</h3>
                <p className="text-3xl font-black text-taja-secondary tracking-tighter italic">Assign to Shop</p>
              </div>

              <div className="space-y-6">
                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Select Shop *
                  </label>
                  <select
                    required
                    value={form.shopId}
                    onChange={(e) => setForm((f) => ({ ...f, shopId: e.target.value }))}
                    className="w-full h-16 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-bold text-taja-secondary appearance-none"
                  >
                    <option value="">Choose a shop…</option>
                    {shops.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.shopName} {s.owner?.fullName ? `— ${s.owner.fullName}` : ""}
                      </option>
                    ))}
                  </select>
                  {shops.length === 0 && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 mt-2">
                      <AlertTriangle className="h-3 w-3" />
                      No shops found. Create one first.
                    </div>
                  )}
                </div>
              </div>
            </motion.section>

            {/* Product Information */}
            <motion.section variants={item} className="glass-panel p-10 border-white/60 rounded-[40px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-taja-primary/5 blur-[100px] rounded-full -z-10" />
              <div className="space-y-1 mb-10">
                <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Foundation</h3>
                <p className="text-3xl font-black text-taja-secondary tracking-tighter italic">Product Details</p>
              </div>

              <div className="space-y-8">
                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full h-16 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-lg font-bold text-taja-secondary placeholder:text-gray-300"
                    placeholder="e.g., Vintage Denim Jacket — Size M"
                  />
                </div>

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Description *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full p-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-3xl text-sm font-medium text-taja-secondary placeholder:text-gray-300 resize-none leading-relaxed"
                    placeholder="Describe the product in detail…"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="group space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                      Category *
                    </label>
                    <select
                      required
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] text-taja-secondary appearance-none"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="group space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                      Condition
                    </label>
                    <select
                      value={form.condition}
                      onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                      className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] text-taja-secondary appearance-none"
                    >
                      <option value="new">Brand New</option>
                      <option value="like-new">Like New</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Media */}
            <motion.section variants={item} className="glass-panel p-10 border-white/60 rounded-[40px] relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -z-10" />
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Visual Assets</h3>
                  <p className="text-3xl font-black text-taja-secondary tracking-tighter italic">Product Media</p>
                </div>
                {imageCount > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 glass-card border-white/60 rounded-xl">
                    <ImageIcon className="h-3.5 w-3.5 text-taja-primary" />
                    <span className="text-[10px] font-black text-taja-secondary uppercase tracking-widest">{imageCount} {imageCount === 1 ? "image" : "images"}</span>
                  </div>
                )}
              </div>

              <div className="group space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                  Image URLs * (one per line)
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.imageUrls}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrls: e.target.value }))}
                  className="w-full p-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-3xl text-sm font-mono text-taja-secondary placeholder:text-gray-300 resize-none leading-relaxed"
                  placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                />
                <p className="text-[9px] font-bold text-gray-400 ml-1 mt-1">Paste direct image links, one per line.</p>
              </div>
            </motion.section>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-4 space-y-8">

            {/* Pricing */}
            <motion.section variants={item} className="glass-panel p-8 border-white/60 rounded-[32px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-taja-primary/5 blur-[80px] rounded-full -z-10" />
              <div className="space-y-1 mb-8">
                <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Commerce</h3>
                <p className="text-2xl font-black text-taja-secondary tracking-tighter italic">Pricing</p>
              </div>

              <div className="space-y-6">
                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Price (₦) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      className="w-full h-14 pl-10 pr-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-lg font-bold text-taja-secondary placeholder:text-gray-300"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Compare at (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.compareAtPrice}
                    onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))}
                    className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-bold text-taja-secondary placeholder:text-gray-300"
                    placeholder="Optional original price"
                  />
                </div>
              </div>
            </motion.section>

            {/* Inventory */}
            <motion.section variants={item} className="glass-panel p-8 border-white/60 rounded-[32px] relative overflow-hidden">
              <div className="space-y-1 mb-8">
                <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Inventory</h3>
                <p className="text-2xl font-black text-taja-secondary tracking-tighter italic">Stock Level</p>
              </div>

              <div className="group space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-bold text-taja-secondary"
                  placeholder="1"
                />
              </div>
            </motion.section>

            {/* Status & Visibility */}
            <motion.section variants={item} className="glass-panel p-8 border-white/60 rounded-[32px] relative overflow-hidden">
              <div className="space-y-1 mb-8">
                <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">Visibility</h3>
                <p className="text-2xl font-black text-taja-secondary tracking-tighter italic">Listing Status</p>
              </div>

              <div className="group space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] text-taja-secondary appearance-none"
                >
                  <option value="active">Active — visible to buyers</option>
                  <option value="draft">Draft — hidden from storefront</option>
                </select>
              </div>
            </motion.section>

            {/* Readiness Checklist */}
            <motion.section variants={item} className="glass-panel p-8 border-white/60 rounded-[32px]">
              <div className="space-y-1 mb-6">
                <p className="text-xl font-black text-taja-secondary tracking-tighter italic">Readiness</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Shop selected", done: !!form.shopId },
                  { label: "Title filled", done: !!form.title.trim() },
                  { label: "Description written", done: !!form.description.trim() },
                  { label: "Category chosen", done: !!form.category },
                  { label: "Price set", done: !!form.price.trim() },
                  { label: "Images added", done: imageCount > 0 },
                ].map((check) => (
                  <div key={check.label} className="flex items-center gap-3">
                    <CheckCircle className={`h-4 w-4 transition-colors ${check.done ? "text-emerald-500" : "text-gray-200"}`} />
                    <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${check.done ? "text-taja-secondary" : "text-gray-300"}`}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.section>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
