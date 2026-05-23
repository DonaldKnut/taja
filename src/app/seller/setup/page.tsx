"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  Check,
  MessageSquare,
  Instagram,
  Music2,
  Plus,
  X,
  Tag,
  Building2,
  Settings2,
  BadgePercent,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import toast from "react-hot-toast";
import { API_BASE_URL, api } from "@/lib/api";


const STEPS = [
  { id: 1, label: "Shop Info", icon: Store },
  { id: 2, label: "Business", icon: Building2 },
  { id: 3, label: "Settings", icon: Settings2 },
];

export default function SellerSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingShop, setCheckingShop] = useState(true);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState("");
  const [formData, setFormData] = useState({
    shopName: "",
    shopSlug: "",
    description: "",
    categories: [] as string[],
    businessInfo: {
      businessType: "individual" as "individual" | "business",
      businessName: "",
      businessAddress: "",
    },
    taxProfile: {
      vatStatus: "unknown" as "unknown" | "not_registered" | "registered",
      vatNumber: "",
      firsTin: "",
    },
    socialLinks: {
      instagram: "",
      tiktok: "",
      whatsapp: "",
      twitter: "",
      facebook: "",
    },
    // Keep only lightweight, non-logistics settings here.
    // All delivery fees, pickup points, tiers & slots are configured later
    // in the dedicated Logistics page.
    settings: {
      responseTime: "within-day",
      returnPolicy: "No returns accepted",
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({ ...prev, [parent]: { ...(prev as any)[parent], [child]: value } }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryChange = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleAddCustomCategory = (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = newCatInput.trim();
    if (!val) return;
    const alreadyExists =
      CATEGORIES.some((c) => c.label.toLowerCase() === val.toLowerCase()) ||
      customCategories.some((c) => c.toLowerCase() === val.toLowerCase());
    if (alreadyExists) {
      toast.error("Category already exists");
      return;
    }
    setCustomCategories((prev) => [...prev, val]);
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(val) ? prev.categories : [...prev.categories, val],
    }));
    setNewCatInput("");
    toast.success(`“${val}” added and selected.`);
  };

  // One shop per user: if they already have a shop, redirect to dashboard (under review)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api("/api/shops/my") as { success?: boolean; data?: { _id: string; status?: string } | null };
        if (cancelled) return;
        if (res?.success && res?.data) {
          toast.success("Your shop is already registered and under review.");
          router.replace("/seller/dashboard");
          return;
        }
      } catch {
        if (!cancelled) setCheckingShop(false);
        return;
      }
      setCheckingShop(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  const handleShopNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const shopName = e.target.value;
    const slug = shopName.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "_").substring(0, 30);
    setFormData((prev) => ({ ...prev, shopName, shopSlug: slug }));
  };

  const generateDescription = () => {
    if (!formData.shopName.trim() || formData.categories.length === 0) {
      toast.error("Add a shop name and at least one category first");
      return;
    }
    setGeneratingDescription(true);
    try {
      const name = formData.shopName.trim();
      const cats = formData.categories;
      const description = [
        `Welcome to ${name}, your trusted online spot for ${cats.join(", ").toLowerCase()}.`,
        "",
        "We help shoppers across Nigeria discover quality items at fair prices, without the usual stress of scrolling through thousands of social media statuses and DMs.",
        `Here you'll find carefully selected products in categories like ${cats.slice(0, 3).join(", ")} and more, with a simple checkout experience on Taja.Shop.`,
        "",
        "Why customers love shopping here:",
        "- Curated products from a real Nigerian seller",
        "- Easy communication and clear pricing",
        "- Secure checkout powered by Taja.Shop",
        "- Less stress compared to random social media buying",
      ].join("\n");
      setFormData((prev) => ({ ...prev, description }));
      toast.success("Description generated. Feel free to edit it!");
    } finally {
      setGeneratingDescription(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formData.shopName || formData.categories.length === 0)) {
      toast.error("Please add a shop name and select at least one category");
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/shops`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Shop created successfully! It’s under review. You won’t see this page again.");
        router.push("/seller/dashboard");
      } else {
        toast.error(data.message || data.error || "Failed to create shop");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingShop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-taja-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-taja-light via-white to-emerald-50 motif-blanc" />
      <div className="fixed top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-taja-primary/10 blur-3xl animate-float -z-10" />
      <div className="fixed bottom-[-15%] right-[-5%] w-[32rem] h-[32rem] rounded-full bg-emerald-200/10 blur-3xl -z-10" />

      <div className="mx-auto w-full min-w-0 max-w-2xl px-3 py-8 sm:px-4 sm:py-10">
        {/* Page header */}
        <div className="mb-8 text-center sm:mb-10">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-taja shadow-premium sm:h-16 sm:w-16">
            <Store className="h-7 w-7 text-white sm:h-8 sm:w-8" />
          </div>
          <h1 className="bg-gradient-to-br from-taja-secondary to-taja-primary bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
            Set Up Your Shop
          </h1>
          <p className="mt-2 px-1 text-sm text-gray-500 sm:text-base">
            Build your storefront and start selling on{" "}
            <span className="font-semibold text-taja-primary">Taja.Shop</span>
          </p>
        </div>

        {/* Step indicator */}
        <div className="-mx-1 mb-6 overflow-x-auto overflow-y-visible px-1 pb-1 scrollbar-hide sm:mb-8">
          <div className="flex min-w-0 items-center justify-center gap-0">
            {STEPS.map((s, idx) => {
              const StepIcon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex shrink-0 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 sm:h-10 sm:w-10 ${
                        isDone ? "bg-taja-primary text-white shadow-premium" : isActive ? "bg-gradient-taja text-white shadow-premium sm:scale-110" : "border-2 border-gray-200 bg-white text-gray-400"
                      }`}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    </div>
                    <span
                      className={`mt-1 max-w-[4.75rem] truncate text-center text-[10px] font-semibold transition-colors sm:max-w-none sm:text-xs ${
                        isActive ? "text-taja-primary" : isDone ? "text-taja-primary/70" : "text-gray-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`mb-5 h-0.5 w-7 shrink-0 transition-all duration-500 sm:mx-1 sm:w-12 md:w-16 ${step > s.id ? "bg-taja-primary" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit}>
          <div className="glass-panel rounded-2xl p-4 shadow-premium-hover sm:rounded-3xl sm:p-6 md:p-8">

            {/* ── Step 1: Shop Info ── */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-xl font-bold text-taja-secondary mb-1">Basic Shop Info</h2>
                  <p className="text-sm text-gray-500">Name your shop and what you sell.</p>
                </div>

                {/* Shop Name + AI idea helper */}
                  <div>
                    <label className="block text-sm font-semibold text-taja-secondary mb-2">
                      Shop Name <span className="text-taja-primary">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.shopName}
                      onChange={handleShopNameChange}
                      placeholder="e.g., Amina's Thrift Store"
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-taja-secondary placeholder:text-gray-300 focus:outline-none focus:border-taja-primary focus:ring-2 focus:ring-taja-primary/20 transition-all"
                    />
                  </div>

                {/* Shop URL */}
                <div>
                  <label className="block text-sm font-semibold text-taja-secondary mb-2">Shop URL</label>
                  <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all focus-within:border-taja-primary focus-within:ring-2 focus-within:ring-taja-primary/20 sm:flex-row sm:items-stretch">
                    <span className="flex items-center border-b border-gray-200 bg-taja-light px-3 py-2.5 text-xs font-medium text-gray-500 sm:border-b-0 sm:border-r sm:py-3 sm:pl-4 sm:pr-2 sm:text-sm">
                      taja.shop/
                    </span>
                    <input
                      name="shopSlug"
                      value={formData.shopSlug}
                      onChange={handleChange}
                      placeholder="shop-url"
                      className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-taja-secondary outline-none placeholder:text-gray-300"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">Lowercase letters, numbers, and underscores only</p>
                </div>

                {/* Description with AI */}
                <div>
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label className="text-sm font-semibold text-taja-secondary">Shop Description</label>
                    <button type="button" onClick={generateDescription} disabled={generatingDescription}
                      className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-gradient-taja px-3 py-2 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto">
                      <Sparkles className="h-3 w-3" />
                      {generatingDescription ? "Generating…" : "AI Generate"}
                    </button>
                  </div>
                  <Textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell customers about your shop…"
                    className="rounded-xl border-gray-200 resize-none focus:border-taja-primary"
                  />
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-semibold text-taja-secondary mb-3">
                    Categories <span className="text-taja-primary">*</span>
                    <span className="ml-2 text-xs text-gray-400 font-normal">(select at least one)</span>
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {CATEGORIES.map(({ label, icon: Icon }) => {
                      const selected = formData.categories.includes(label);
                      return (
                        <button key={label} type="button" onClick={() => handleCategoryChange(label)}
                          className={`relative flex min-w-0 items-center gap-2 rounded-xl border-2 p-3 text-left text-sm font-medium transition-all ${selected ? "border-taja-primary bg-taja-primary/10 text-taja-secondary shadow-premium" : "border-gray-200 text-gray-600 hover:border-taja-primary/40"}`}>
                          <Icon className={`h-4 w-4 ${selected ? "text-taja-primary" : "text-gray-400"}`} />
                          <span className="min-w-0 flex-1 break-words leading-tight text-[11px] font-black uppercase tracking-tight">{label}</span>
                          {selected && <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-taja-primary flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white" /></span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <label className="block text-sm font-semibold text-taja-secondary mb-2">Add your own category</label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                      <input
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        placeholder="e.g., Baby & Kids"
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm focus:border-taja-primary focus:outline-none focus:ring-2 focus:ring-taja-primary/20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomCategory();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={() => handleAddCustomCategory()} className="h-11 w-full shrink-0 rounded-xl border-taja-primary/30 px-4 text-taja-primary sm:w-auto">
                        <Plus className="mr-1 inline h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {customCategories.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your categories</p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {customCategories.map((cat) => {
                          const selected = formData.categories.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => handleCategoryChange(cat)}
                              className={`relative flex min-w-0 items-center gap-2 rounded-xl border-2 p-3 text-left text-sm font-medium transition-all ${selected ? "border-taja-primary bg-taja-primary/10 text-taja-secondary shadow-premium" : "border-gray-200 text-gray-600 hover:border-taja-primary/40"}`}
                            >
                              <Sparkles className={`h-4 w-4 ${selected ? "text-taja-primary" : "text-gray-400"}`} />
                              <span className="min-w-0 flex-1 break-words leading-tight text-[11px] font-black uppercase tracking-tight">{cat}</span>
                              {selected && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-taja-primary flex items-center justify-center">
                                  <Check className="h-2.5 w-2.5 text-white" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {formData.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 p-3 bg-taja-light rounded-xl border border-taja-primary/10">
                      {formData.categories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white border border-taja-primary/15 text-taja-secondary rounded-full font-medium"
                        >
                          {cat}
                          <button
                            type="button"
                            onClick={() => handleCategoryChange(cat)}
                            className="ml-0.5 text-gray-400 hover:text-rose-500 transition-colors"
                            aria-label={`Remove ${cat}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <Button type="button" variant="gradient" onClick={nextStep} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-bold">
                    Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 2: Business Details ── */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-xl font-bold text-taja-secondary mb-1">Business Details</h2>
                  <p className="text-sm text-gray-500">Tell us about your business type and socials.</p>
                </div>

                {/* Business Type */}
                <div>
                  <label className="block text-sm font-semibold text-taja-secondary mb-3">Business Type</label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { value: "individual", label: "Individual", sub: "Personal seller", emoji: "👤" },
                      { value: "business", label: "Business", sub: "Registered company", emoji: "🏢" },
                    ].map(({ value, label, sub, emoji }) => (
                      <button key={value} type="button"
                        onClick={() => setFormData((p) => ({ ...p, businessInfo: { ...p.businessInfo, businessType: value as any } }))}
                        className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all ${formData.businessInfo.businessType === value ? "border-taja-primary bg-taja-primary/10 shadow-premium" : "border-gray-200 hover:border-taja-primary/40"}`}>
                        <span className="text-2xl mb-2">{emoji}</span>
                        <p className="font-semibold text-taja-secondary">{label}</p>
                        <p className="text-xs text-gray-500">{sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.businessInfo.businessType === "business" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-taja-secondary mb-2">Business Name</label>
                      <input name="businessInfo.businessName" type="text" value={formData.businessInfo.businessName} onChange={handleChange}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-taja-primary focus:ring-2 focus:ring-taja-primary/20 transition-all"
                        placeholder="Your registered business name" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-taja-secondary mb-2">Business Address</label>
                      <Textarea name="businessInfo.businessAddress" rows={3} value={formData.businessInfo.businessAddress} onChange={handleChange}
                        className="rounded-xl border-gray-200 resize-none focus:border-taja-primary" placeholder="Your business address" />
                    </div>
                  </>
                )}

                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <BadgePercent className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-taja-secondary">VAT / FIRS (Optional at setup)</p>
                      <p className="text-xs text-gray-600">
                        Add this now if you are VAT-registered. You can always update it later.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-taja-secondary mb-2">VAT Status</label>
                      <select
                        name="taxProfile.vatStatus"
                        value={formData.taxProfile.vatStatus}
                        onChange={handleChange}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-taja-primary focus:ring-2 focus:ring-taja-primary/20 text-sm transition-all"
                      >
                        <option value="unknown">Not sure yet</option>
                        <option value="not_registered">Not VAT-registered</option>
                        <option value="registered">VAT-registered</option>
                      </select>
                    </div>
                    {formData.taxProfile.vatStatus === "registered" && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-taja-secondary mb-2">VAT Number</label>
                          <input
                            name="taxProfile.vatNumber"
                            type="text"
                            value={formData.taxProfile.vatNumber}
                            onChange={handleChange}
                            className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-taja-primary focus:ring-2 focus:ring-taja-primary/20 text-sm transition-all"
                            placeholder="Your VAT registration number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-taja-secondary mb-2">FIRS TIN</label>
                          <input
                            name="taxProfile.firsTin"
                            type="text"
                            value={formData.taxProfile.firsTin}
                            onChange={handleChange}
                            className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-taja-primary focus:ring-2 focus:ring-taja-primary/20 text-sm transition-all"
                            placeholder="Tax Identification Number (TIN)"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-taja-light border border-taja-primary/20 mb-4">
                    <Sparkles className="h-4 w-4 text-taja-primary flex-shrink-0" />
                    <p className="text-xs text-taja-secondary font-medium">
                      Connect your socials to help customers reach you and reduce DM chaos!
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-taja-secondary mb-2">
                        <Instagram className="h-4 w-4 text-pink-500" /> Instagram
                      </label>
                      <input name="socialLinks.instagram" type="text" value={formData.socialLinks.instagram} onChange={handleChange}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-taja-primary focus:ring-2 focus:ring-taja-primary/20 text-sm transition-all"
                        placeholder="your_handle (no @)" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-taja-secondary mb-2">
                        <Music2 className="h-4 w-4 text-slate-800" /> TikTok
                      </label>
                      <input name="socialLinks.tiktok" type="text" value={formData.socialLinks.tiktok} onChange={handleChange}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-taja-primary focus:ring-2 focus:ring-taja-primary/20 text-sm transition-all"
                        placeholder="@username or profile URL" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-taja-secondary mb-2">
                        <MessageSquare className="h-4 w-4 text-green-500" /> WhatsApp
                      </label>
                      <input name="socialLinks.whatsapp" type="tel" value={formData.socialLinks.whatsapp} onChange={handleChange}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-taja-primary focus:ring-2 focus:ring-taja-primary/20 text-sm transition-all"
                        placeholder="234812345678" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-gray-100 pt-2 sm:flex-row sm:items-center sm:gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-6 sm:w-auto"><ChevronLeft className="h-4 w-4" />Back</Button>
                  <Button type="button" variant="gradient" onClick={() => setStep(3)} className="flex h-12 w-full flex-1 items-center justify-center gap-2 rounded-xl font-bold sm:min-w-0">Continue<ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Settings ── */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-xl font-bold text-taja-secondary mb-1">Shop Settings</h2>
                  <p className="text-sm text-gray-500">
                    Set your response time and basic policies. You&apos;ll configure delivery fees, pickup points and slots later in your seller dashboard.
                  </p>
                </div>

                {/* Response Time */}
                <div>
                  <label className="block text-sm font-semibold text-taja-secondary mb-3">Response Time</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      { value: "within-hour", label: "Within 1 hour" },
                      { value: "within-day", label: "Within 24 hrs" },
                      { value: "1-2-days", label: "1–2 days" },
                      { value: "3-5-days", label: "3–5 days" },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, settings: { ...p.settings, responseTime: value } }))}
                        className={`rounded-xl border-2 p-3 text-left text-xs font-medium transition-all sm:text-sm ${
                          formData.settings.responseTime === value
                            ? "border-taja-primary bg-taja-primary/10 text-taja-secondary"
                            : "border-gray-200 hover:border-taja-primary/40 text-gray-600"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Return Policy */}
                <div>
                  <label className="block text-sm font-semibold text-taja-secondary mb-2">Return Policy</label>
                  <Textarea
                    name="settings.returnPolicy"
                    rows={3}
                    value={formData.settings.returnPolicy}
                    onChange={handleChange}
                    className="rounded-xl border-gray-200 resize-none focus:border-taja-primary"
                    placeholder="Describe your return policy…"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-taja-light border border-taja-primary/15 flex items-start gap-3">
                  <Sparkles className="h-4 w-4 text-taja-primary mt-0.5" />
                  <p className="text-xs text-gray-600">
                    Detailed delivery fees, pickup locations, weight tiers and delivery slots are all managed from your{" "}
                    <span className="font-semibold text-taja-primary">Logistics Hub</span> in the seller dashboard after launch.
                  </p>
                </div>

                <div className="flex flex-col gap-2 border-t border-gray-100 pt-2 sm:flex-row sm:items-center sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-6 sm:w-auto"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={loading}
                    className="flex h-12 w-full flex-1 items-center justify-center gap-2 rounded-xl font-bold sm:min-w-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Launch Shop
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            Step {step} of 3 — all settings can be changed later from your seller dashboard.
          </p>
        </form>
      </div>
    </div>
  );
}
