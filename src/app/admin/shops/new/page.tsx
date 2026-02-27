"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  CheckCircle,
  Globe,
  Type,
  FileText,
  Upload,
  Instagram,
  MessageCircle,
  Link2,
} from "lucide-react";
import { motion } from "framer-motion";
import { api, uploadShopImage } from "@/lib/api";
import toast from "react-hot-toast";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function AdminShopsNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({
    shopName: "",
    shopSlug: "",
    description: "",
    about: "",
    tagline: "",
    coverImage: "",
    logo: "",
    instagram: "",
    tiktok: "",
    whatsapp: "",
    twitter: "",
    facebook: "",
    website: "",
    youtube: "",
    linkedin: "",
  });

  const handleImageFile = async (file: File, type: "logo" | "banner") => {
    const setUploading = type === "banner" ? setUploadingCover : setUploadingLogo;
    try {
      setUploading(true);
      const url = await uploadShopImage(file, type);
      if (type === "banner") {
        setForm((f) => ({ ...f, coverImage: url }));
      } else {
        setForm((f) => ({ ...f, logo: url }));
      }
      toast.success(type === "banner" ? "Cover image uploaded" : "Logo uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleShopNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);
    setForm((f) => ({ ...f, shopName: name, shopSlug: slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shopName.trim()) {
      toast.error("Shop name is required");
      return;
    }
    const slug = (form.shopSlug || form.shopName)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    if (!slug) {
      toast.error("Shop slug is required (use letters or numbers)");
      return;
    }
    setLoading(true);
    try {
      const res = await api("/api/admin/shops", {
        method: "POST",
        body: JSON.stringify({
          shopName: form.shopName.trim(),
          shopSlug: slug,
          description: form.description.trim() || undefined,
          about: form.about.trim() || undefined,
          tagline: form.tagline.trim() || undefined,
          coverImage: form.coverImage.trim() || undefined,
          banner: form.coverImage.trim() || undefined,
          logo: form.logo.trim() || undefined,
          avatar: form.logo.trim() || undefined,
          socialLinks: {
            instagram: form.instagram.trim() || undefined,
            tiktok: form.tiktok.trim() || undefined,
            whatsapp: form.whatsapp.trim() || undefined,
            twitter: form.twitter.trim() || undefined,
            facebook: form.facebook.trim() || undefined,
            website: form.website.trim() || undefined,
            youtube: form.youtube.trim() || undefined,
            linkedin: form.linkedin.trim() || undefined,
          },
        }),
      });
      if (res?.success) {
        toast.success("Shop created. You can add products to it from Admin → Products.");
        router.push("/admin/products");
      } else {
        toast.error(res?.message || "Failed to create shop");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create shop");
    } finally {
      setLoading(false);
    }
  };

  const hasRequiredFields = !!form.shopName.trim();

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
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !hasRequiredFields}
              className="flex items-center gap-3 px-8 py-3 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-premium hover:shadow-premium-hover hover:bg-emerald-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-emerald-400" />}
              Create Shop
            </button>
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

            {/* Shop Identity */}
            <motion.section variants={item} className="glass-panel p-10 border-white/60 rounded-[40px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -z-10" />
              <div className="space-y-1 mb-10">
                <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Identity</h3>
                <p className="text-3xl font-black text-taja-secondary tracking-tighter italic">Shop Details</p>
              </div>

              <div className="space-y-8">
                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Shop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.shopName}
                    onChange={handleShopNameChange}
                    className="w-full h-16 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-lg font-bold text-taja-secondary placeholder:text-gray-300"
                    placeholder="e.g., Taja Official Store"
                  />
                </div>

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    URL Slug *
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <input
                      type="text"
                      value={form.shopSlug}
                      onChange={(e) => setForm((f) => ({ ...f, shopSlug: e.target.value }))}
                      className="w-full h-14 pl-10 pr-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-mono font-bold text-taja-secondary placeholder:text-gray-300"
                      placeholder="taja-official"
                    />
                  </div>
                  {form.shopSlug && (
                    <p className="text-[9px] font-bold text-taja-primary/60 ml-1">
                      tajaapp.shop/shop/<span className="text-taja-primary font-black">{form.shopSlug}</span>
                    </p>
                  )}
                </div>

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full p-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-3xl text-sm font-medium text-taja-secondary placeholder:text-gray-300 resize-none leading-relaxed"
                    placeholder="A brief description of what this shop offers…"
                  />
                </div>

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    About (longer story for showroom)
                  </label>
                  <textarea
                    rows={4}
                    value={form.about}
                    onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
                    className="w-full p-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-3xl text-sm font-medium text-taja-secondary placeholder:text-gray-300 resize-none leading-relaxed"
                    placeholder="Full brand story, merchant bio, what they sell, why buyers should trust them…"
                  />
                </div>

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={form.tagline}
                    onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                    className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-bold text-taja-secondary placeholder:text-gray-300"
                    placeholder="One-line motto or tagline"
                  />
                </div>
              </div>
            </motion.section>

            {/* Social & contact – for full showroom */}
            <motion.section variants={item} className="glass-panel p-10 border-white/60 rounded-[40px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 blur-[80px] rounded-full -z-10" />
              <div className="space-y-1 mb-10">
                <h3 className="text-[10px] font-black text-violet-600 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Link2 className="h-3 w-3" /> Social & contact
                </h3>
                <p className="text-3xl font-black text-taja-secondary tracking-tighter italic">Showroom links</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { key: "instagram", label: "Instagram", placeholder: "@username or full URL" },
                  { key: "tiktok", label: "TikTok", placeholder: "@username or full URL" },
                  { key: "whatsapp", label: "WhatsApp", placeholder: "Phone e.g. 2348012345678" },
                  { key: "twitter", label: "Twitter / X", placeholder: "@handle or URL" },
                  { key: "facebook", label: "Facebook", placeholder: "Page URL" },
                  { key: "website", label: "Website", placeholder: "https://..." },
                  { key: "youtube", label: "YouTube", placeholder: "Channel or video URL" },
                  { key: "linkedin", label: "LinkedIn", placeholder: "Profile or company URL" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="group space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
                    <input
                      type="text"
                      value={form[key as keyof typeof form] as string}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full h-12 px-4 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 rounded-xl text-sm font-medium text-taja-secondary placeholder:text-gray-300"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Visual Branding */}
            <motion.section variants={item} className="glass-panel p-10 border-white/60 rounded-[40px] relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -z-10" />
              <div className="space-y-1 mb-10">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Visual Assets</h3>
                <p className="text-3xl font-black text-taja-secondary tracking-tighter italic">Branding</p>
              </div>

              <div className="space-y-8">
                {/* Cover / Banner */}
                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors flex items-center gap-2">
                    <ImageIcon className="h-3 w-3" />
                    Cover / Banner Image
                  </label>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Paste link or upload</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="url"
                      value={form.coverImage}
                      onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                      className="flex-1 h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-mono font-bold text-taja-secondary placeholder:text-gray-300"
                      placeholder="https://example.com/cover.jpg"
                    />
                    <label className="flex items-center justify-center gap-2 h-14 px-6 rounded-2xl border-2 border-dashed border-white/60 bg-white/30 hover:border-taja-primary/50 hover:bg-white/50 cursor-pointer transition-all shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFile(file, "banner");
                          e.target.value = "";
                        }}
                        disabled={uploadingCover}
                      />
                      {uploadingCover ? (
                        <Loader2 className="h-5 w-5 animate-spin text-taja-primary" />
                      ) : (
                        <Upload className="h-5 w-5 text-taja-primary" />
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-taja-secondary">
                        {uploadingCover ? "Uploading…" : "Choose file"}
                      </span>
                    </label>
                  </div>
                  {form.coverImage && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-white/60 max-h-40 shadow-sm">
                      <img
                        src={form.coverImage}
                        alt="Cover preview"
                        className="w-full h-40 object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  )}
                </div>

                {/* Logo / Avatar */}
                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors flex items-center gap-2">
                    <ImageIcon className="h-3 w-3" />
                    Logo / Avatar Image
                  </label>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Paste link or upload</p>
                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    <input
                      type="url"
                      value={form.logo}
                      onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                      className="flex-1 w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-mono font-bold text-taja-secondary placeholder:text-gray-300"
                      placeholder="https://example.com/logo.png"
                    />
                    <label className="flex items-center justify-center gap-2 h-14 px-6 rounded-2xl border-2 border-dashed border-white/60 bg-white/30 hover:border-taja-primary/50 hover:bg-white/50 cursor-pointer transition-all shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFile(file, "logo");
                          e.target.value = "";
                        }}
                        disabled={uploadingLogo}
                      />
                      {uploadingLogo ? (
                        <Loader2 className="h-5 w-5 animate-spin text-taja-primary" />
                      ) : (
                        <Upload className="h-5 w-5 text-taja-primary" />
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-taja-secondary">
                        {uploadingLogo ? "Uploading…" : "Choose file"}
                      </span>
                    </label>
                  </div>
                  {form.logo && (
                    <div className="mt-3 flex items-center gap-3">
                      <img
                        src={form.logo}
                        alt="Logo preview"
                        className="w-20 h-20 rounded-2xl object-cover border border-white/60 shadow-sm"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Logo Preview</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-4 space-y-8">

            {/* Live Preview Card */}
            <motion.section variants={item} className="glass-panel border-white/60 rounded-[32px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full -z-10" />

              {/* Mini banner */}
              <div className="h-28 bg-gradient-to-br from-emerald-500 via-taja-primary to-taja-secondary rounded-t-[32px] relative overflow-hidden">
                {form.coverImage && (
                  <img
                    src={form.coverImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              <div className="p-8 pt-0 relative">
                {/* Logo */}
                <div className="-mt-10 mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                    {form.logo ? (
                      <img
                        src={form.logo}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML = `<span class="text-3xl font-black text-taja-secondary italic">${form.shopName.charAt(0) || "?"}</span>`;
                        }}
                      />
                    ) : (
                      <span className="text-3xl font-black text-taja-secondary italic">
                        {form.shopName.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-xl font-black text-taja-secondary tracking-tight italic truncate">
                  {form.shopName || "Shop Name"}
                </h4>
                {form.tagline && (
                  <p className="text-[10px] font-bold text-gray-400 mt-1 truncate">{form.tagline}</p>
                )}
                {form.shopSlug && (
                  <p className="text-[9px] font-bold text-taja-primary/60 mt-2 font-mono">
                    /{form.shopSlug}
                  </p>
                )}
                {form.description && (
                  <p className="text-xs font-medium text-gray-400 mt-3 leading-relaxed line-clamp-3">{form.description}</p>
                )}
              </div>
            </motion.section>

            {/* Readiness Checklist */}
            <motion.section variants={item} className="glass-panel p-8 border-white/60 rounded-[32px]">
              <div className="space-y-1 mb-6">
                <p className="text-xl font-black text-taja-secondary tracking-tighter italic">Readiness</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Shop name set", done: !!form.shopName.trim() },
                  { label: "URL slug created", done: !!form.shopSlug.trim() },
                  { label: "Description added", done: !!form.description.trim() },
                  { label: "Cover image linked", done: !!form.coverImage.trim() },
                  { label: "Logo uploaded", done: !!form.logo.trim() },
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

            {/* Tip Card */}
            <motion.section variants={item} className="glass-panel p-8 border-white/60 rounded-[32px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 blur-[60px] rounded-full -z-10" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-taja-secondary uppercase tracking-widest mb-2">Pro Tip</h5>
                  <p className="text-xs font-medium text-gray-400 leading-relaxed">
                    After creating the shop, head to <strong className="text-taja-secondary">Admin → Products → Add Product</strong> to populate this storefront with listings.
                  </p>
                </div>
              </div>
            </motion.section>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
