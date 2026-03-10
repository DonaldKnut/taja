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
  Tag,
  Building2,
  Settings2,
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
  const [suggestingShopNames, setSuggestingShopNames] = useState(false);
  const [shopIdea, setShopIdea] = useState("");
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
    socialLinks: {
      instagram: "",
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

  const suggestShopNames = async () => {
    if (!shopIdea.trim() && formData.categories.length === 0) {
      toast.error("Type a short idea or pick at least one category first.");
      return;
    }
    setSuggestingShopNames(true);
    try {
      const res = await api("/api/ai/shop-suggestions", {
        method: "POST",
        body: JSON.stringify({
          idea: shopIdea,
          categories: formData.categories,
        }),
      });
      if ((res as any)?.success) {
        const names: string[] = (res as any).names || [];
        const tagline: string = (res as any).tagline || "";
        if (!names.length && !tagline) {
          toast.error("AI could not find good suggestions. Try rephrasing your idea.");
          return;
        }
        setFormData((prev) => ({
          ...prev,
          shopName: prev.shopName || names[0] || prev.shopName,
          shopSlug:
            prev.shopSlug ||
            (names[0]
              ? names[0].toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "_").substring(0, 30)
              : prev.shopSlug),
          description:
            prev.description ||
            (tagline
              ? `${tagline}\n\n${prev.description || ""}`.trim()
              : prev.description),
        }));
        if (names.length) {
          toast.success("Shop name ideas added. You can tweak them.");
        } else {
          toast.success("Tagline added. You can tweak it.");
        }
      } else {
        toast.error((res as any)?.message || "Failed to generate shop suggestions.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate shop suggestions.");
    } finally {
      setSuggestingShopNames(false);
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

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-taja shadow-premium mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-taja-secondary to-taja-primary">
            Set Up Your Shop
          </h1>
          <p className="text-gray-500 mt-2">
            Build your storefront and start selling on{" "}
            <span className="text-taja-primary font-semibold">Taja.Shop</span>
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, idx) => {
            const StepIcon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isDone ? "bg-taja-primary text-white shadow-premium" : isActive ? "bg-gradient-taja text-white shadow-premium scale-110" : "bg-white border-2 border-gray-200 text-gray-400"}`}>
                    {isDone ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  <span className={`mt-1 text-xs font-semibold transition-colors ${isActive ? "text-taja-primary" : isDone ? "text-taja-primary/70" : "text-gray-400"}`}>{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 mx-1 mb-5 transition-all duration-500 ${step > s.id ? "bg-taja-primary" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit}>
          <div className="glass-panel rounded-3xl p-8 shadow-premium-hover">

            {/* ── Step 1: Shop Info ── */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-xl font-bold text-taja-secondary mb-1">Basic Shop Info</h2>
                  <p className="text-sm text-gray-500">Name your shop and what you sell.</p>
                </div>

                {/* Shop Name + AI idea helper */}
                <div className="space-y-3">
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
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Describe your shop idea (optional, powers AI helper)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={shopIdea}
                        onChange={(e) => setShopIdea(e.target.value)}
                        placeholder="e.g., thrift clothes in Ibadan for students"
                        className="flex-1 h-10 px-3 rounded-xl border border-gray-200 bg-white text-xs text-taja-secondary placeholder:text-gray-300 focus:outline-none focus:border-taja-primary/60 focus:ring-1 focus:ring-taja-primary/20 transition-all"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={suggestShopNames}
                        disabled={suggestingShopNames}
                        className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                      >
                        {suggestingShopNames ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        AI Name Ideas
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Shop URL */}
                <div>
                  <label className="block text-sm font-semibold text-taja-secondary mb-2">Shop URL</label>
                  <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden focus-within:border-taja-primary focus-within:ring-2 focus-within:ring-taja-primary/20 transition-all bg-white">
                    <span className="pl-4 pr-2 py-3 bg-taja-light border-r border-gray-200 text-sm text-gray-500 font-medium whitespace-nowrap">taja.shop/</span>
                    <input
                      name="shopSlug"
                      value={formData.shopSlug}
                      onChange={handleChange}
                      placeholder="shop-url"
                      className="flex-1 px-3 py-3 outline-none bg-transparent text-taja-secondary text-base placeholder:text-gray-300"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Lowercase letters, numbers, and underscores only</p>
                </div>

                {/* Description with AI */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-taja-secondary">Shop Description</label>
                    <button type="button" onClick={generateDescription} disabled={generatingDescription}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gradient-taja text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-opacity">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map(({ label, icon: Icon }) => {
                      const selected = formData.categories.includes(label);
                      return (
                        <button key={label} type="button" onClick={() => handleCategoryChange(label)}
                          className={`relative flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${selected ? "border-taja-primary bg-taja-primary/10 text-taja-secondary shadow-premium" : "border-gray-200 hover:border-taja-primary/40 text-gray-600"}`}>
                          <Icon className={`h-4 w-4 ${selected ? "text-taja-primary" : "text-gray-400"}`} />
                          <span className="leading-tight text-[11px] font-black uppercase tracking-tight">{label}</span>
                          {selected && <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-taja-primary flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white" /></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <Button type="button" variant="gradient" onClick={nextStep} className="w-full h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2">
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
                  <div className="grid grid-cols-2 gap-3">
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
                        <MessageSquare className="h-4 w-4 text-green-500" /> WhatsApp
                      </label>
                      <input name="socialLinks.whatsapp" type="tel" value={formData.socialLinks.whatsapp} onChange={handleChange}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-taja-primary focus:ring-2 focus:ring-taja-primary/20 text-sm transition-all"
                        placeholder="234812345678" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex items-center gap-2 rounded-xl h-12 px-6"><ChevronLeft className="h-4 w-4" />Back</Button>
                  <Button type="button" variant="gradient" onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2">Continue<ChevronRight className="h-4 w-4" /></Button>
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
                  <div className="grid grid-cols-2 gap-2">
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
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
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

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 rounded-xl h-12 px-6"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={loading}
                    className="flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2"
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
