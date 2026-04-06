"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  Loader2,
  Image as ImageIcon,
  Link2,
  Upload,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, uploadShopImage } from "@/lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { ShareShopButton } from "@/components/shop/ShareShopButton";

const SOCIAL_KEYS = [
  { key: "instagram", label: "Instagram", placeholder: "@username or URL" },
  { key: "tiktok", label: "TikTok", placeholder: "@username or URL" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "e.g. 2348012345678" },
  { key: "twitter", label: "Twitter / X", placeholder: "@handle or URL" },
  { key: "facebook", label: "Facebook", placeholder: "Page URL" },
  { key: "website", label: "Website", placeholder: "https://..." },
  { key: "youtube", label: "YouTube", placeholder: "Channel or video URL" },
  { key: "linkedin", label: "LinkedIn", placeholder: "Profile or company URL" },
] as const;

export default function SellerShopEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [form, setForm] = useState({
    shopSlug: "",
    shopName: "",
    description: "",
    about: "",
    tagline: "",
    logo: "",
    banner: "",
    instagram: "",
    tiktok: "",
    whatsapp: "",
    twitter: "",
    facebook: "",
    website: "",
    youtube: "",
    linkedin: "",
    returnPolicy: "",
    responseTime: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api("/api/shops/my") as { success?: boolean; data?: any };
        if (cancelled) return;
        if (!res?.success || !res?.data) {
          toast.error("No shop found. Complete setup first.");
          router.replace("/seller/setup");
          return;
        }
        const s = res.data;
        setForm({
          shopSlug: s.shopSlug ?? "",
          shopName: s.shopName ?? "",
          description: s.description ?? "",
          about: s.about ?? "",
          tagline: s.tagline ?? "",
          logo: s.logo ?? s.avatar ?? "",
          banner: s.banner ?? s.coverImage ?? "",
          instagram: s.socialLinks?.instagram ?? "",
          tiktok: s.socialLinks?.tiktok ?? "",
          whatsapp: s.socialLinks?.whatsapp ?? "",
          twitter: s.socialLinks?.twitter ?? "",
          facebook: s.socialLinks?.facebook ?? "",
          website: s.socialLinks?.website ?? "",
          youtube: s.socialLinks?.youtube ?? "",
          linkedin: s.socialLinks?.linkedin ?? "",
          returnPolicy: s.settings?.returnPolicy ?? "",
          responseTime: s.settings?.responseTime ?? "",
        });
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message ?? "Failed to load shop");
        router.replace("/seller/dashboard");
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const handleImageUpload = async (file: File, type: "logo" | "banner") => {
    const setUploading = type === "banner" ? setUploadingBanner : setUploadingLogo;
    try {
      setUploading(true);
      const url = await uploadShopImage(file, type);
      if (type === "banner") setForm((f) => ({ ...f, banner: url }));
      else setForm((f) => ({ ...f, logo: url }));
      toast.success(type === "banner" ? "Cover uploaded" : "Logo uploaded");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const myRes = await api("/api/shops/my") as { success?: boolean; data?: { _id: string } };
      if (!myRes?.success || !myRes?.data?._id) {
        toast.error("Shop not found");
        return;
      }
      setLoading(true);
      const socialLinks: Record<string, string> = {};
      SOCIAL_KEYS.forEach(({ key }) => {
        const v = form[key].trim();
        if (v) socialLinks[key] = v;
      });
      const res = await api(`/api/shops/${myRes.data._id}`, {
        method: "PUT",
        body: JSON.stringify({
          shopName: form.shopName.trim() || undefined,
          description: form.description.trim() || undefined,
          about: form.about.trim() || undefined,
          tagline: form.tagline.trim() || undefined,
          logo: form.logo.trim() || undefined,
          banner: form.banner.trim() || undefined,
          avatar: form.logo.trim() || undefined,
          coverImage: form.banner.trim() || undefined,
          socialLinks: Object.keys(socialLinks).length ? socialLinks : undefined,
          settings: (() => {
            const r = form.returnPolicy.trim();
            const t = form.responseTime.trim();
            if (!r && !t) return undefined;
            return { ...(r ? { returnPolicy: r } : {}), ...(t ? { responseTime: t } : {}) };
          })(),
        }),
      });
      if (res?.success) {
        toast.success("Shop profile updated");
        router.push("/seller/dashboard");
      } else {
        toast.error(res?.message ?? "Update failed");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-taja-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/seller/dashboard"
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-taja-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-2xl font-black text-taja-secondary tracking-tight flex items-center gap-2">
          <Store className="h-6 w-6 text-taja-primary" />
          Shop profile
        </h1>
      </div>
      {form.shopSlug && (
        <div className="mb-6">
          <ShareShopButton shopSlug={form.shopSlug} shopName={form.shopName || "my shop"} />
        </div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-10"
      >
        {/* Identity */}
        <section className="glass-card p-8 rounded-3xl border border-white/60 space-y-6">
          <h2 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.2em]">Identity</h2>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Shop name</label>
            <input
              type="text"
              value={form.shopName}
              onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:border-taja-primary focus:ring-0 font-medium"
              placeholder="Your shop name"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Short description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-taja-primary focus:ring-0 text-sm"
              placeholder="Brief tagline for cards and headers"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">About (showroom story)</label>
            <textarea
              rows={4}
              value={form.about}
              onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-taja-primary focus:ring-0 text-sm"
              placeholder="Full brand story for your showroom page"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white focus:border-taja-primary focus:ring-0 text-sm"
              placeholder="One-line motto"
            />
          </div>
        </section>

        {/* Branding */}
        <section className="glass-card p-8 rounded-3xl border border-white/60 space-y-6">
          <h2 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.2em] flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5" /> Branding
          </h2>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Logo</label>
            <div className="flex gap-3 items-start">
              <input
                type="url"
                value={form.logo}
                onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-white focus:border-taja-primary focus:ring-0 text-sm"
                placeholder="https://..."
              />
              <label className="flex items-center gap-2 h-11 px-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-taja-primary/50 cursor-pointer text-[10px] font-bold uppercase shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f, "logo");
                    e.target.value = "";
                  }}
                  disabled={uploadingLogo}
                />
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload
              </label>
            </div>
            {form.logo && (
              <img src={form.logo} alt="Logo" className="mt-2 w-20 h-20 rounded-xl object-cover border border-gray-100" onError={(e) => (e.currentTarget.style.display = "none")} />
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Cover / banner</label>
            <div className="flex gap-3 items-start">
              <input
                type="url"
                value={form.banner}
                onChange={(e) => setForm((f) => ({ ...f, banner: e.target.value }))}
                className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-white focus:border-taja-primary focus:ring-0 text-sm"
                placeholder="https://..."
              />
              <label className="flex items-center gap-2 h-11 px-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-taja-primary/50 cursor-pointer text-[10px] font-bold uppercase shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f, "banner");
                    e.target.value = "";
                  }}
                  disabled={uploadingBanner}
                />
                {uploadingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload
              </label>
            </div>
            {form.banner && (
              <img src={form.banner} alt="Banner" className="mt-2 w-full max-h-32 rounded-xl object-cover border border-gray-100" onError={(e) => (e.currentTarget.style.display = "none")} />
            )}
          </div>
        </section>

        {/* Social & links */}
        <section className="glass-card p-8 rounded-3xl border border-white/60 space-y-6">
          <h2 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.2em] flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5" /> Social & contact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SOCIAL_KEYS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white focus:border-taja-primary focus:ring-0 text-sm"
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Settings */}
        <section className="glass-card p-8 rounded-3xl border border-white/60 space-y-6">
          <h2 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.2em]">Policies</h2>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Return policy</label>
            <textarea
              rows={2}
              value={form.returnPolicy}
              onChange={(e) => setForm((f) => ({ ...f, returnPolicy: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-taja-primary focus:ring-0 text-sm"
              placeholder="e.g. Returns within 7 days if unused"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Response time</label>
            <input
              type="text"
              value={form.responseTime}
              onChange={(e) => setForm((f) => ({ ...f, responseTime: e.target.value }))}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white focus:border-taja-primary focus:ring-0 text-sm"
              placeholder="e.g. within-24-hours"
            />
          </div>
        </section>

        <div className="flex justify-end gap-4">
          <Link href="/seller/dashboard">
            <Button type="button" variant="outline" className="rounded-xl">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading} className="rounded-xl gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save shop profile
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
