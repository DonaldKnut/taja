"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Upload,
  Store,
  X,
  Loader2,
  ImageIcon,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Tag,
  Info,
  Globe,
  Palette,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import { Button } from "@/components/ui/Button";
import { OnboardingNavbar } from "@/components/ui/OnboardingNavbar";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { shopsApi, uploadShopImage, api } from "@/lib/api";
import { toast } from "react-hot-toast";


const STEPS = [
  { id: 1, label: "Branding", icon: Palette },
  { id: 2, label: "Details", icon: Info },
  { id: 3, label: "Categories", icon: Tag },
];

export default function NewShopPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingShop, setCheckingShop] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [formData, setFormData] = useState({
    shopName: "",
    shopSlug: "",
    description: "",
    categories: [] as string[],
    logo: "",
    banner: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api("/api/shops/my") as { success?: boolean; data?: { _id: string } | null };
        if (cancelled) return;
        if (res?.success && res?.data) {
          toast.success("You already have a shop. It’s under review.");
          router.replace("/seller/dashboard");
        }
      } catch {
        if (!cancelled) setCheckingShop(false);
        return;
      }
      setCheckingShop(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "shopName") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 30);
      setFormData((prev) => ({ ...prev, shopSlug: slug }));
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

  const handleImageUpload = async (file: File, type: "logo" | "banner") => {
    const setUploading = type === "logo" ? setUploadingLogo : setUploadingBanner;
    try {
      setUploading(true);
      const url = await uploadShopImage(file, type);
      setFormData((prev) => ({ ...prev, [type]: url }));
      toast.success(`${type === "logo" ? "Logo" : "Banner"} uploaded!`);
    } catch (error: any) {
      toast.error(`Failed to upload ${type}: ${error.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image size must be less than 5MB"); return; }
    handleImageUpload(file, type);
  };

  const canProceedStep2 = formData.shopName.trim().length > 0 && formData.shopSlug.trim().length > 0;
  const canProceedStep3 = formData.categories.length > 0;

  const nextStep = () => {
    if (step === 2 && !canProceedStep2) { toast.error("Please fill in the shop name and URL"); return; }
    setStep((s) => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceedStep2) { toast.error("Shop name and URL are required"); return; }
    if (!canProceedStep3) { toast.error("Please select at least one category"); return; }
    try {
      setLoading(true);
      const response = await shopsApi.create({
        shopName: formData.shopName.trim(),
        shopSlug: formData.shopSlug.trim(),
        description: formData.description.trim() || undefined,
        categories: formData.categories,
        logo: formData.logo || undefined,
        banner: formData.banner || undefined,
      });
      if (response.success) {
        toast.success("Shop created successfully! It’s under review. You won’t see this page again.");
        router.push("/seller/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create shop");
    } finally {
      setLoading(false);
    }
  };

  const stepIconClass = (s: typeof STEPS[number]) => {
    const isDone = step > s.id;
    const isActive = step === s.id;
    if (isDone) return "bg-taja-primary text-white shadow-premium";
    if (isActive) return "bg-gradient-taja text-white shadow-premium scale-110";
    return "bg-white border-2 border-gray-200 text-gray-400";
  };

  const stepLabelClass = (s: typeof STEPS[number]) => {
    if (step === s.id) return "text-taja-primary";
    if (step > s.id) return "text-taja-primary/70";
    return "text-gray-400";
  };

  const catBtnClass = (selected: boolean) => {
    if (selected) return "border-taja-primary bg-taja-primary/10 text-taja-secondary shadow-premium";
    return "border-gray-200 hover:border-taja-primary/40 hover:bg-taja-light/60 text-gray-600";
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
      <OnboardingNavbar currentPageLabel="Create Your Shop" />

      {/* ── Animated background ── */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-taja-light via-white to-emerald-50" />
      <div className="fixed top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-taja-primary/10 blur-3xl animate-float -z-10" />
      <div className="fixed bottom-[-15%] right-[-5%] w-[32rem] h-[32rem] rounded-full bg-emerald-300/10 blur-3xl -z-10" />
      <div className="fixed top-[40%] right-[15%] w-64 h-64 rounded-full bg-taja-accent/10 blur-2xl animate-float -z-10" />

      <div className="relative overflow-hidden flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-2xl">

          {/* Page header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-taja shadow-premium mb-4">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-taja-secondary to-taja-primary">
              Launch Your Shop
            </h1>
            <p className="text-gray-500 mt-2 text-base">
              Set up your storefront and start selling on{" "}
              <span className="text-taja-primary font-semibold">Taja.Shop</span>
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((s, idx) => {
              const StepIcon = s.icon;
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${stepIconClass(s)}`}>
                      {step > s.id ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                    </div>
                    <span className={`mt-1 text-xs font-semibold transition-colors ${stepLabelClass(s)}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-16 h-0.5 mx-1 mb-5 transition-all duration-500 ${step > s.id ? "bg-taja-primary" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Card */}
          <div className="glass-panel rounded-3xl p-8 shadow-premium-hover">
            <form onSubmit={handleSubmit}>

              {/* ═══ STEP 1 – Branding ═══ */}
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <h2 className="text-xl font-bold text-taja-secondary mb-1">Brand Your Shop</h2>
                    <p className="text-sm text-gray-500">Upload a banner and logo to make your shop stand out.</p>
                  </div>

                  {/* Banner Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-taja-secondary mb-3">
                      Shop Banner
                      <span className="ml-2 text-xs text-gray-400 font-normal">(optional · up to 5 MB)</span>
                    </label>
                    {formData.banner ? (
                      <div className="relative group rounded-2xl overflow-hidden">
                        <div className="relative h-48 w-full rounded-2xl overflow-hidden ring-2 ring-taja-primary/30">
                          <Image src={formData.banner} alt="Shop banner" fill className="object-cover" sizes="(max-width: 768px) 100vw, 672px" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, banner: "" }))}
                          className="absolute top-3 right-3 p-2 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-red-600 shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-taja-primary hover:bg-taja-light/50 transition-all duration-300 bg-gray-50/60 group">
                        <div className="flex flex-col items-center justify-center">
                          {uploadingBanner ? (
                            <>
                              <Loader2 className="h-10 w-10 animate-spin text-taja-primary mb-3" />
                              <span className="text-sm font-medium text-taja-primary">Uploading…</span>
                            </>
                          ) : (
                            <>
                              <div className="w-14 h-14 rounded-full bg-taja-light flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <ImageIcon className="h-6 w-6 text-taja-primary" />
                              </div>
                              <p className="text-sm font-semibold text-gray-700">Click to upload banner</p>
                              <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF · max 5 MB</p>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, "banner")} disabled={uploadingBanner} />
                      </label>
                    )}
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-taja-secondary mb-3">
                      Shop Logo
                      <span className="ml-2 text-xs text-gray-400 font-normal">(optional · up to 5 MB)</span>
                    </label>
                    <div className="flex items-center gap-6">
                      {formData.logo ? (
                        <div className="relative group flex-shrink-0">
                          <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-taja-primary/20 shadow-premium">
                            <Image src={formData.logo} alt="Shop logo" fill className="object-cover" sizes="112px" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, logo: "" }))}
                            className="absolute -top-1 -right-1 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-red-600 shadow"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex-shrink-0 flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-gray-200 rounded-full cursor-pointer hover:border-taja-primary hover:bg-taja-light/50 transition-all duration-300 bg-gray-50/60 group">
                          <div className="flex flex-col items-center justify-center">
                            {uploadingLogo ? (
                              <Loader2 className="h-7 w-7 animate-spin text-taja-primary" />
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-taja-light flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                  <Upload className="h-4 w-4 text-taja-primary" />
                                </div>
                                <span className="text-xs text-gray-500 font-medium mt-1">Logo</span>
                              </>
                            )}
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, "logo")} disabled={uploadingLogo} />
                        </label>
                      )}
                      <div className="text-sm text-gray-500 leading-relaxed">
                        <p className="font-semibold text-taja-secondary mb-1">Your shop logo</p>
                        Square image (at least 200×200 px) recommended. This appears beside your shop name everywhere on Taja.Shop.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ STEP 2 – Details ═══ */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <h2 className="text-xl font-bold text-taja-secondary mb-1">Shop Details</h2>
                    <p className="text-sm text-gray-500">Give your shop a memorable name and a unique URL.</p>
                  </div>

                  <div>
                    <label htmlFor="shopName" className="block text-sm font-semibold text-taja-secondary mb-2">
                      Shop Name <span className="text-taja-primary">*</span>
                    </label>
                    <Input
                      id="shopName"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleChange}
                      placeholder="e.g., Amina Thrift"
                      required
                      maxLength={50}
                      className="h-12 text-base rounded-xl border-gray-200 focus:border-taja-primary focus:ring-taja-primary/20"
                    />
                    <p className="mt-1.5 text-xs text-gray-400">{formData.shopName.length}/50 characters</p>
                  </div>

                  <div>
                    <label htmlFor="shopSlug" className="block text-sm font-semibold text-taja-secondary mb-2">
                      Shop URL <span className="text-taja-primary">*</span>
                    </label>
                    <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden focus-within:border-taja-primary focus-within:ring-2 focus-within:ring-taja-primary/20 transition-all bg-white">
                      <div className="flex items-center gap-1.5 pl-4 pr-2 py-3 bg-taja-light border-r border-gray-200 flex-shrink-0">
                        <Globe className="h-4 w-4 text-taja-primary" />
                        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">taja.shop/shop/</span>
                      </div>
                      <input
                        id="shopSlug"
                        name="shopSlug"
                        value={formData.shopSlug}
                        onChange={handleChange}
                        placeholder="amina-thrift"
                        required
                        pattern="[a-z0-9-]+"
                        maxLength={30}
                        className="flex-1 px-3 py-3 text-base outline-none bg-transparent text-taja-secondary placeholder:text-gray-300"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">
                      Lowercase letters, numbers, and hyphens only · {formData.shopSlug.length}/30
                    </p>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-taja-secondary mb-2">
                      Description
                      <span className="ml-2 text-xs text-gray-400 font-normal">(optional)</span>
                    </label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Tell customers what makes your shop special…"
                      rows={4}
                      maxLength={500}
                      className="rounded-xl border-gray-200 focus:border-taja-primary focus:ring-taja-primary/20 resize-none text-base"
                    />
                    <p className="mt-1.5 text-xs text-gray-400">{formData.description.length}/500 characters</p>
                  </div>
                </div>
              )}

              {/* ═══ STEP 3 – Categories ═══ */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <h2 className="text-xl font-bold text-taja-secondary mb-1">Pick Your Categories</h2>
                    <p className="text-sm text-gray-500">Select one or more categories so buyers can find you easily.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map(({ label, icon: Icon }) => {
                      const selected = formData.categories.includes(label);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => handleCategoryChange(label)}
                          className={`relative flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 text-left group ${catBtnClass(selected)}`}
                        >
                          <Icon className={`h-4 w-4 ${selected ? "text-taja-primary" : "text-gray-400"}`} />
                          <span className="leading-tight text-[11px] font-black uppercase tracking-tight">{label}</span>
                          {selected && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-taja-primary flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {formData.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-taja-light rounded-xl">
                      {formData.categories.map((cat) => (
                        <span key={cat} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white border border-taja-primary/20 text-taja-secondary rounded-full font-medium shadow-sm">
                          {cat}
                          <button type="button" onClick={() => handleCategoryChange(cat)} className="ml-0.5 text-gray-400 hover:text-red-400 transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep} className="flex items-center gap-2 rounded-xl h-12 px-6">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl h-12 px-6">
                    Cancel
                  </Button>
                )}

                {step < 3 ? (
                  <Button type="button" variant="gradient" onClick={nextStep} className="flex-1 flex items-center justify-center gap-2 rounded-xl h-12 text-base font-bold">
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || uploadingLogo || uploadingBanner || !canProceedStep3}
                    variant="gradient"
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl h-12 text-base font-bold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating Shop…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Launch My Shop
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Step footnote */}
          <p className="text-center text-xs text-gray-400 mt-5">
            Step {step} of {STEPS.length} — you can edit everything later from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
