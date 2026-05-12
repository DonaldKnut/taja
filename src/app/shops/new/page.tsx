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
  Plus,
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
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState("");

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
  
  const handleAddCustomCategory = (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = newCatInput.trim();
    if (!val) return;
    
    // Check if already exists in CATEGORIES or customCategories
    const alreadyExists = CATEGORIES.some(c => c.label.toLowerCase() === val.toLowerCase()) || 
                          customCategories.some(c => c.toLowerCase() === val.toLowerCase());
    
    if (alreadyExists) {
      toast.error("Category already exists");
      return;
    }

    setCustomCategories(prev => [...prev, val]);
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, val]
    }));
    setNewCatInput("");
    toast.success(`"${val}" added and selected!`);
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
    if (isActive) return "bg-gradient-taja text-white shadow-premium sm:scale-110";
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

      <div className="relative flex w-full min-w-0 justify-center overflow-x-hidden py-8 px-3 sm:py-10 sm:px-4">
        <div className="w-full max-w-2xl min-w-0">

          {/* Page header */}
          <div className="mb-8 text-center sm:mb-10">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-taja shadow-premium sm:h-16 sm:w-16">
              <Store className="h-7 w-7 text-white sm:h-8 sm:w-8" />
            </div>
            <h1 className="bg-gradient-to-br from-taja-secondary to-taja-primary bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
              Launch Your Shop
            </h1>
            <p className="mt-2 px-1 text-sm text-gray-500 sm:text-base">
              Set up your storefront and start selling on{" "}
              <span className="font-semibold text-taja-primary">Taja.Shop</span>
            </p>
          </div>

          {/* Step indicator — scrolls on very narrow screens instead of crushing */}
          <div className="-mx-1 mb-6 overflow-x-auto overflow-y-visible px-1 pb-1 scrollbar-hide sm:mb-8">
            <div className="flex min-w-0 items-center justify-center gap-0">
              {STEPS.map((s, idx) => {
                const StepIcon = s.icon;
                return (
                  <div key={s.id} className="flex shrink-0 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 sm:h-10 sm:w-10 ${stepIconClass(s)}`}
                      >
                        {step > s.id ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                      </div>
                      <span className={`mt-1 max-w-[4.5rem] truncate text-center text-[10px] font-semibold transition-colors sm:max-w-none sm:text-xs ${stepLabelClass(s)}`}>
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
          <div className="glass-panel rounded-2xl p-4 shadow-premium-hover sm:rounded-3xl sm:p-6 md:p-8">
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
                    <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
                      {formData.logo ? (
                        <div className="group relative flex shrink-0 justify-center sm:justify-start">
                          <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-taja-primary/20 shadow-premium sm:h-28 sm:w-28">
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
                        <label className="group flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center self-center rounded-full border-2 border-dashed border-gray-200 bg-gray-50/60 transition-all duration-300 hover:border-taja-primary hover:bg-taja-light/50 sm:h-28 sm:w-28 sm:self-auto">
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
                      <div className="min-w-0 text-sm leading-relaxed text-gray-500">
                        <p className="mb-1 font-semibold text-taja-secondary">Your shop logo</p>
                        <p className="text-xs sm:text-sm">
                          Square image (at least 200×200 px) recommended. This appears beside your shop name everywhere on Taja.Shop.
                        </p>
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
                    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all focus-within:border-taja-primary focus-within:ring-2 focus-within:ring-taja-primary/20 sm:flex-row sm:items-stretch">
                      <div className="flex items-center gap-1.5 border-b border-gray-200 bg-taja-light px-3 py-2.5 sm:border-b-0 sm:border-r sm:py-3 sm:pl-4 sm:pr-2">
                        <Globe className="h-4 w-4 shrink-0 text-taja-primary" />
                        <span className="break-words text-xs font-medium leading-snug text-gray-500 sm:text-sm sm:whitespace-nowrap">
                          taja.shop/shop/
                        </span>
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
                        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-taja-secondary outline-none placeholder:text-gray-300"
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

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {CATEGORIES.map(({ label, icon: Icon }) => {
                      const selected = formData.categories.includes(label);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => handleCategoryChange(label)}
                          className={`relative flex min-w-0 items-center gap-2.5 rounded-xl border-2 p-3.5 text-left text-sm font-semibold transition-all duration-200 group ${catBtnClass(selected)}`}
                        >
                          <Icon className={`h-4 w-4 ${selected ? "text-taja-primary" : "text-gray-400"}`} />
                          <span className="min-w-0 flex-1 break-words leading-tight text-[11px] font-black uppercase tracking-tight">{label}</span>
                          {selected && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-taja-primary flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                      <label className="block text-sm font-semibold text-taja-secondary mb-3">
                        Can't find your category? Add it here:
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                        <Input
                          value={newCatInput}
                          onChange={(e) => setNewCatInput(e.target.value)}
                          placeholder="e.g., Vintage Collectibles"
                          className="h-11 w-full rounded-xl"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomCategory();
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => handleAddCustomCategory()}
                          className="h-11 w-full shrink-0 rounded-xl border-taja-primary/30 px-4 text-taja-primary transition-all hover:bg-taja-primary hover:text-white sm:w-auto"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Show Custom Categories in the grid too */}
                    {customCategories.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Added Categories</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                          {customCategories.map((cat) => {
                            const selected = formData.categories.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => handleCategoryChange(cat)}
                                className={`relative flex min-w-0 items-center gap-2.5 rounded-xl border-2 p-3.5 text-left text-sm font-semibold transition-all duration-200 group ${catBtnClass(selected)}`}
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
              <div className="mt-8 flex flex-col gap-2 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:gap-3">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep} className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-6 sm:w-auto">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => router.back()} className="h-12 w-full rounded-xl px-6 sm:w-auto sm:shrink-0">
                    Cancel
                  </Button>
                )}

                {step < 3 ? (
                  <Button type="button" variant="gradient" onClick={nextStep} className="flex h-12 w-full flex-1 items-center justify-center gap-2 rounded-xl text-base font-bold sm:min-w-0">
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || uploadingLogo || uploadingBanner || !canProceedStep3}
                    variant="gradient"
                    className="flex h-12 w-full flex-1 items-center justify-center gap-2 rounded-xl text-base font-bold sm:min-w-0"
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
