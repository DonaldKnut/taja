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
  Upload,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { api, uploadProductImage } from "@/lib/api";
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
    maxPrice: "",
    compareAtPrice: "",
    imageUrls: "",
    condition: "new",
    stock: "1",
    status: "active",
    variants: [] as any[],
  });
  const [shipping, setShipping] = useState({
    weight: "",
    shippingCost: "",
    freeShipping: false,
  });
  const [imageList, setImageList] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

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
    const fromPaste = form.imageUrls.trim() ? form.imageUrls.trim().split(/[\n\s]+/).filter(Boolean) : [];
    const images = [...imageList, ...fromPaste].filter(Boolean);
    if (images.length === 0) {
      toast.error("Add at least one image (upload or paste URLs)");
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
          maxPrice: form.maxPrice ? parseFloat(form.maxPrice) : undefined,
          compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
          images,
          condition: form.condition,
          stock: parseInt(form.stock) || 1,
          status: isDraft ? "draft" : form.status,
          shipping: {
            weight: shipping.weight ? parseFloat(shipping.weight) : 0,
            shippingCost: shipping.shippingCost ? parseFloat(shipping.shippingCost) : 0,
            freeShipping: shipping.freeShipping,
          },
          variants: form.variants.map((v) => ({
            ...v,
            price: parseFloat(String(v.price)),
            stock: parseInt(String(v.stock)) || 0,
            weight: parseFloat(String(v.weight)) || 0,
          })),
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

  const fromPasteCount = form.imageUrls.trim() ? form.imageUrls.trim().split(/[\n\s]+/).filter(Boolean).length : 0;
  const imageCount = imageList.length + fromPasteCount;
  const hasRequiredFields =
    !!form.shopId && !!form.title.trim() && !!form.description.trim() && !!form.category && !!form.price.trim() && imageCount > 0;

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const toUpload = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 10 - imageList.length);
    if (toUpload.length === 0) {
      toast.error("Select image files only (e.g. JPG, PNG)");
      return;
    }
    if (toUpload.length < files.length) toast.error("Only image files were added. Max 10 images.");
    setUploadingImages(true);
    try {
      const urls = await Promise.all(toUpload.map((file) => uploadProductImage(file)));
      setImageList((prev) => [...prev, ...urls].slice(0, 10));
      toast.success(`${urls.length} image(s) uploaded`);
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImageList((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: "",
          price: prev.price || "0",
          stock: prev.stock || "1",
          sku: "",
          weight: shipping.weight || "0",
        },
      ],
    }));
  };

  const updateVariant = (index: number, field: string, value: string) => {
    setForm((prev) => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const removeVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-motif-blanc selection:bg-taja-primary/30">
      {/* ── Sticky Action Bar ── */}
      <nav className="sticky top-[72px] lg:top-0 z-40 border-b border-taja-primary/10 bg-white/80 backdrop-blur-xl">
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

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-2">
                    Upload images *
                  </label>
                  <label className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed border-white/60 rounded-2xl cursor-pointer hover:border-taja-primary/50 hover:bg-white/20 transition-all bg-white/5 group">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      disabled={uploadingImages || imageList.length >= 10}
                    />
                    {uploadingImages ? (
                      <div className="flex flex-col items-center gap-2 py-6">
                        <Loader2 className="h-10 w-10 animate-spin text-taja-primary" />
                        <span className="text-[10px] font-bold text-taja-primary uppercase tracking-widest">Uploading…</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-6">
                        <div className="w-14 h-14 rounded-2xl bg-taja-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="h-6 w-6 text-taja-primary" />
                        </div>
                        <span className="text-[10px] font-black text-taja-secondary uppercase tracking-widest">Choose multiple images</span>
                        <span className="text-[9px] font-bold text-gray-400">JPG, PNG, WebP · up to 10</span>
                      </div>
                    )}
                  </label>
                </div>

                {imageList.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-3">Preview ({imageList.length} uploaded)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {imageList.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border border-white/60 bg-slate-100 group/thumb">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500/90 text-white rounded-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-rose-600"
                            aria-label="Remove image"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Or paste image URLs (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={form.imageUrls}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrls: e.target.value }))}
                    className="w-full p-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-3xl text-sm font-mono text-taja-secondary placeholder:text-gray-300 resize-none leading-relaxed"
                    placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                  />
                  <p className="text-[9px] font-bold text-gray-400 ml-1 mt-1">Paste direct image links, one per line. These are added to uploaded images.</p>
                </div>
              </div>
            </motion.section>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-4 space-y-8">

            {/* Pricing / Logistics */}
            <motion.section variants={item} className="glass-panel p-8 border-white/60 rounded-[32px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-taja-primary/5 blur-[80px] rounded-full -z-10" />
              <div className="space-y-1 mb-8">
                <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Commerce</h3>
                <p className="text-2xl font-black text-taja-secondary tracking-tighter italic">Pricing & Logistics</p>
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
                    Delivery Fee (₦)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shipping.shippingCost}
                      onChange={(e) => setShipping((s) => ({ ...s, shippingCost: e.target.value }))}
                      className="w-full h-14 pl-10 pr-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-lg font-bold text-taja-secondary placeholder:text-gray-300"
                      placeholder="Flat rate"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 glass-card border-white/60 rounded-2xl bg-white/20">
                  <input
                    type="checkbox"
                    id="freeShipping"
                    checked={shipping.freeShipping}
                    onChange={(e) => setShipping((s) => ({ ...s, freeShipping: e.target.checked }))}
                    className="h-5 w-5 rounded border-gray-300 text-taja-primary focus:ring-taja-primary"
                  />
                  <label htmlFor="freeShipping" className="text-[10px] font-black uppercase tracking-widest text-taja-secondary cursor-pointer">
                    Enable Free Shipping
                  </label>
                </div>
              </div>
            </motion.section>

            {/* Logistics Protocol */}
            <motion.section variants={item} className="glass-panel p-8 border-white/60 rounded-[32px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full -z-10" />
              <div className="space-y-1 mb-8">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Logistics</h3>
                <p className="text-2xl font-black text-taja-secondary tracking-tighter italic">Logistics Protocol</p>
              </div>

              <div className="group space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                  Product Weight (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shipping.weight}
                  onChange={(e) => setShipping((s) => ({ ...s, weight: e.target.value }))}
                  className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-bold text-taja-secondary"
                  placeholder="0.00"
                />
              </div>
            </motion.section>

            {/* Product Variations */}
            <motion.section variants={item} className="glass-panel p-6 sm:p-8 border-white/60 rounded-[32px] relative overflow-hidden bg-gradient-to-br from-white to-gray-50/30">
              <div className="absolute top-0 left-0 w-48 h-48 bg-taja-primary/5 blur-[80px] rounded-full -z-10" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Product Options</h3>
                  <p className="text-xl sm:text-2xl font-black text-taja-secondary tracking-tighter italic">Variations</p>
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center justify-center gap-2 px-6 h-12 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-taja-primary transition-all w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Option
                </button>
              </div>

              {form.variants.length > 0 ? (
                <div className="space-y-6">
                  {/* Desktop Headers - Hidden on Mobile */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 px-4 mb-2">
                    <div className="col-span-4 text-[8px] font-black uppercase tracking-widest text-gray-400">Option Name (e.g. Red / XL)</div>
                    <div className="col-span-2 text-[8px] font-black uppercase tracking-widest text-gray-400">Price (₦)</div>
                    <div className="col-span-2 text-[8px] font-black uppercase tracking-widest text-gray-400">Stock</div>
                    <div className="col-span-3 text-[8px] font-black uppercase tracking-widest text-gray-400">Weight (kg)</div>
                    <div className="col-span-1"></div>
                  </div>

                  <AnimatePresence>
                    {form.variants.map((v, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative p-6 sm:p-4 glass-card bg-white border-gray-100 rounded-[2rem] sm:rounded-[1.5rem] shadow-sm hover:shadow-premium transition-all group"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-4 items-end sm:items-center">
                          {/* Option Name Input */}
                          <div className="sm:col-span-4 space-y-2 sm:space-y-0">
                            <label className="sm:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Option Name</label>
                            <input
                              type="text"
                              value={v.name}
                              onChange={(e) => updateVariant(i, "name", e.target.value)}
                              placeholder="e.g. Red / XL"
                              className="w-full h-12 sm:h-12 px-4 glass-card border-white/20 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-taja-primary/20 rounded-xl text-xs font-bold transition-all"
                            />
                          </div>

                          {/* Price Input */}
                          <div className="sm:col-span-2 space-y-2 sm:space-y-0">
                            <label className="sm:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (₦)</label>
                            <input
                              type="number"
                              value={v.price}
                              onChange={(e) => updateVariant(i, "price", e.target.value)}
                              placeholder="Same as base"
                              className="w-full h-12 sm:h-12 px-4 glass-card border-white/20 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-taja-primary/20 rounded-xl text-xs font-black text-taja-primary transition-all"
                            />
                          </div>

                          {/* Stock Input */}
                          <div className="sm:col-span-2 space-y-2 sm:space-y-0">
                            <label className="sm:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock</label>
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) => updateVariant(i, "stock", e.target.value)}
                              className="w-full h-12 sm:h-12 px-4 glass-card border-white/20 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-taja-primary/20 rounded-xl text-xs font-bold transition-all"
                            />
                          </div>

                          {/* Weight Input */}
                          <div className="sm:col-span-3 space-y-2 sm:space-y-0">
                            <label className="sm:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Weight (kg)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={v.weight}
                              onChange={(e) => updateVariant(i, "weight", e.target.value)}
                              placeholder="Weight"
                              className="w-full h-12 sm:h-12 px-4 glass-card border-white/20 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-taja-primary/20 rounded-xl text-xs font-medium text-gray-400 transition-all"
                            />
                          </div>

                          {/* Remove Button */}
                          <div className="sm:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeVariant(i)}
                              className="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors shadow-sm bg-white border border-gray-100"
                            >
                              <X className="h-4 w-4 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/30">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-premium flex items-center justify-center mb-4">
                    <LayoutGrid className="w-6 h-6 text-gray-200" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-4">No product options defined yet</p>
                </div>
              )}
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
