"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/contexts/AuthContext";
import {
  Upload,
  X,
  Camera,
  Tag,
  Package,
  Truck,
  ArrowLeft,
  Save,
  Eye,
  Star,
  GripVertical,
  Loader2,
  Sparkles,
  DollarSign,
  Target,
  Plus,
  LayoutGrid,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import toast from "react-hot-toast";
import { api, sellerApi, shopsApi, uploadProductImage } from "@/lib/api";
import { z } from "zod";
import { ShopRequirementModal } from "@/components/shop/ShopRequirementModal";

// Zod schema for required publish fields
const productPublishSchema = z.object({
  title: z.string().min(1, "Product Title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z
    .string()
    .min(1, "Price is required")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      },
      { message: "Price must be at least 0" }
    ),
  images: z
    .array(z.string().min(1))
    .min(1, "Please add at least one product image"),
});

const categoryFields: Record<string, string[]> = {
  "Fashion & Clothing": ["size", "color", "gender", "material"],
  "Fashion": ["size", "color", "gender", "material"],
  "Electronics & Gadgets": ["brand", "model", "technicalSpecs", "warranty"],
  "Electronics": ["brand", "model", "technicalSpecs", "warranty"],
  "Medicines & Health": ["manufacturer", "expiryDate", "dosage", "ingredients"],
  "Medicines": ["manufacturer", "expiryDate", "dosage", "ingredients"],
};

// Categories are now fetched from the database

const conditions = [
  { value: "new", label: "New", desc: "Brand new, unused" },
  { value: "like-new", label: "Like New", desc: "Minimal signs of wear" },
  { value: "good", label: "Good", desc: "Some wear but fully functional" },
  { value: "fair", label: "Fair", desc: "Noticeable wear but works well" },
  { value: "poor", label: "Poor", desc: "Significant wear, may have defects" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const colors = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Pink",
  "Purple",
  "Gray",
  "Brown",
];

export default function NewProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const variantImageInputRef = useRef<HTMLInputElement>(null);
  const variantImageIndexRef = useRef<number>(0);
  const [loading, setLoading] = useState(false);
  const [checkingShop, setCheckingShop] = useState(true);
  const [hasShop, setHasShop] = useState(false);
  const [isVerifiedSeller, setIsVerifiedSeller] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVariantImage, setUploadingVariantImage] = useState<number | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [suggestingTags, setSuggestingTags] = useState(false);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    condition: "good",
    price: "",
    compareAtPrice: "",
    currency: "NGN",
    images: [] as string[],
    specifications: {
      brand: "",
      size: "",
      color: "",
      material: "",
      gender: "",
      model: "",
      technicalSpecs: "",
      warranty: "",
      manufacturer: "",
      expiryDate: "",
      dosage: "",
      ingredients: "",
    } as Record<string, any>,
    inventory: {
      quantity: 1,
      sku: "",
      trackQuantity: true,
      moq: 1,
    },
    shipping: {
      weight: "",
      freeShipping: false,
      shippingCost: "",
      costPerKg: "",
      processingTime: "1-2-days",
    },
    seo: {
      tags: [] as string[],
      metaTitle: "",
      metaDescription: "",
    },
    variants: [] as {
      _id?: string;
      name: string;
      price: string;
      stock: string;
      weight: string;
      sku?: string;
      image?: string;
      active: boolean;
    }[],
    status: "active" as "active" | "draft",
  });
  const [tagInput, setTagInput] = useState("");

  const canAddProducts = hasShop && isVerifiedSeller;

  // Redirect if no shop or not verified — user shouldn't see this page until setup + verification are done
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await api("/api/shops/my") as { success?: boolean; data?: { _id: string } | null };
        if (cancelled) return;

        const shop = res?.success ? res?.data ?? null : null;
        const verified = user?.kyc?.status === "approved";

        if (!shop) {
          setCheckingShop(false);
          toast.error("Set up your shop first to add products.");
          router.replace("/seller/setup");
          return;
        }
        setHasShop(true);
        if (!verified) {
          setCheckingShop(false);
          toast.error("Complete seller verification to add products.");
          router.replace("/onboarding/kyc");
          return;
        }

        setIsVerifiedSeller(true);

        // Fetch categories
        const catRes = await api("/api/seller/categories");
        if (catRes?.success) {
          setAllCategories(catRes.data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error checking shop/verification:", err);
          setHasShop(false);
          setIsVerifiedSeller(false);
        }
      } finally {
        if (!cancelled) setCheckingShop(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [child]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value },
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).slice(0, 8 - formData.images.length).map(async (file) => {
        // Use the upload API helper for product images
        const url = await uploadProductImage(file);
        return url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const isFirstImage = formData.images.length === 0;

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls].slice(0, 8), // Max 8 images
      }));
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);

      // Auto-analyze the first image to fill fields
      if (isFirstImage && uploadedUrls.length > 0) {
        handleAnalyzeImage(uploadedUrls[0]);
      }
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error?.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const setMainImage = (index: number) => {
    if (index === 0) return; // Already main
    setFormData((prev) => {
      const newImages = [...prev.images];
      const [removed] = newImages.splice(index, 1);
      newImages.unshift(removed);
      return {
        ...prev,
        images: newImages,
      };
    });
    toast.success("Main image updated");
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setFormData((prev) => {
      const newImages = [...prev.images];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      return {
        ...prev,
        images: newImages,
      };
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.seo.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          tags: [...prev.seo.tags, tagInput.trim()],
        },
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        tags: prev.seo.tags.filter((t) => t !== tag),
      },
    }));
  };

  // AI: Generate product description
  const handleGenerateDescription = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a product title first");
      return;
    }

    setGeneratingDescription(true);
    try {
      const response = await api("/api/ai/generate-description", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
        }),
      });

      if (response?.description) {
        setFormData((prev) => ({
          ...prev,
          description: response.description,
        }));
        toast.success("Description generated with AI");
      }
    } catch (error: any) {
      console.error("AI description error:", error);
      toast.error(error?.message || "Failed to generate description");
    } finally {
      setGeneratingDescription(false);
    }
  };

  // AI: Suggest product tags
  const handleSuggestTags = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a product title first");
      return;
    }

    setSuggestingTags(true);
    try {
      const response = await api("/api/ai/suggest-tags", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          count: 10,
        }),
      });

      if (response?.tags && Array.isArray(response.tags)) {
        setFormData((prev) => ({
          ...prev,
          seo: {
            ...prev.seo,
            tags: [...new Set([...prev.seo.tags, ...response.tags])].slice(0, 15),
          },
        }));
        toast.success(`${response.tags.length} tags suggested by AI`);
      }
    } catch (error: any) {
      console.error("AI tags error:", error);
      toast.error(error?.message || "Failed to suggest tags");
    } finally {
      setSuggestingTags(false);
    }
  };

  // AI: Analyze product image
  const handleAnalyzeImage = async (imageUrl: string) => {
    if (analyzingImage) return;

    setAnalyzingImage(true);
    const analysisToast = toast.loading("AI is analyzing your product image...");

    try {
      const response = await api("/api/ai/analyze-image", {
        method: "POST",
        body: JSON.stringify({ imageUrl }),
      });

      if (response?.analysis) {
        const { analysis } = response;

        // Smart Category Mapping
        let matchedCategory = "";
        if (analysis.category) {
          const aiCat = analysis.category.toLowerCase();
          const aiSub = (analysis.subcategory || "").toLowerCase();

          // Try to find a match in system categories
          const systemMatch = allCategories.find(cat =>
            cat.name.toLowerCase() === aiCat ||
            cat.name.toLowerCase() === aiSub ||
            aiCat.includes(cat.name.toLowerCase()) ||
            cat.name.toLowerCase().includes(aiCat)
          );

          if (systemMatch) {
            matchedCategory = systemMatch._id || systemMatch.name;
          }
        }

        // Auto-fill Title if empty
        const newTitle = !formData.title.trim() && analysis.seoTitle ? analysis.seoTitle : formData.title;

        // Auto-fill all fields
        setFormData((prev) => ({
          ...prev,
          title: newTitle,
          category: matchedCategory || prev.category,
          description: analysis.description || prev.description,
          specifications: {
            ...prev.specifications,
            color: analysis.attributes?.colors?.[0] || prev.specifications.color,
            material: analysis.attributes?.materials?.[0] || prev.specifications.material,
            gender: (analysis.attributes?.gender || "").toLowerCase() || prev.specifications.gender,
            style: analysis.attributes?.style || prev.specifications.style,
          },
          seo: {
            ...prev.seo,
            tags: [...new Set([...prev.seo.tags, ...(analysis.tags || [])])].slice(0, 15),
            metaTitle: analysis.seoTitle || prev.seo.metaTitle,
            metaDescription: analysis.seoDescription || prev.seo.metaDescription,
          },
        }));

        if (analysis.suggestedPriceRange) {
          setSuggestedPrice(analysis.suggestedPriceRange);
        }

        toast.success("Magic! AI has auto-filled your product details.", { id: analysisToast });

        // If we have a title but still no full description, trigger description generator
        if (newTitle && (!analysis.description || analysis.description.length < 50)) {
          handleGenerateDescription();
        }
      }
    } catch (error: any) {
      console.error("AI image analysis error:", error);
      toast.error(error?.message || "AI was unable to analyze this image", { id: analysisToast });
    } finally {
      setAnalyzingImage(false);
    }
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { name: "", price: prev.price, stock: "1", weight: prev.shipping.weight || "0", active: true }
      ]
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const variantIndex = variantImageIndexRef.current;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file?.type.startsWith("image/")) {
      toast.error("Select an image file (JPG, PNG, etc.)");
      return;
    }
    if (formData.images.length >= 8) {
      toast.error("Max 8 images. Remove one from the main product images first.");
      return;
    }
    setUploadingVariantImage(variantIndex);
    try {
      const url = await uploadProductImage(file);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, url].slice(0, 8),
      }));
      updateVariant(variantIndex, "image", url);
      toast.success("Variant image uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploadingVariantImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();

    if (!canAddProducts) {
      toast.error("Set up your shop and complete seller verification to add products.");
      return;
    }

    // Zod validation for required fields
    const validation = productPublishSchema.safeParse({
      title: formData.title.trim(),
      description: (formData.description || "").trim(),
      category: (formData.category || "").trim(),
      price: formData.price.trim(),
      images: formData.images || [],
    });

    if (!validation.success) {
      const messages = Array.from(
        new Set(validation.error.issues.map((issue) => issue.message))
      );
      toast.error(messages.join("\n"));
      return;
    }

    setLoading(true);

    try {
      // Get user's shop
      const shopsResponse = await shopsApi.getAll({ limit: 1 });
      let userShop;

      if (shopsResponse?.data?.shops?.[0]) {
        userShop = shopsResponse.data.shops[0];
      } else if (shopsResponse?.shops?.[0]) {
        userShop = shopsResponse.shops[0];
      } else if (shopsResponse?.data?.[0]) {
        userShop = shopsResponse.data[0];
      } else if (Array.isArray(shopsResponse) && shopsResponse[0]) {
        userShop = shopsResponse[0];
      }

      if (!userShop) {
        toast.error("Please create a shop first before adding products");
        setLoading(false);
        router.push("/seller/setup");
        return;
      }

      const productData = {
        name: formData.title,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        condition: formData.condition,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice
          ? parseFloat(formData.compareAtPrice)
          : undefined,
        currency: formData.currency,
        images: formData.images,
        specifications: formData.specifications,
        inventory: {
          quantity: formData.inventory.quantity,
          sku: formData.inventory.sku || undefined,
          trackQuantity: formData.inventory.trackQuantity,
          moq: formData.inventory.moq ?? 1,
        },
        shipping: {
          weight: formData.shipping.weight ? parseFloat(formData.shipping.weight) : 0,
          freeShipping: formData.shipping.freeShipping,
          shippingCost: formData.shipping.shippingCost ? parseFloat(formData.shipping.shippingCost) : 0,
          costPerKg: formData.shipping.costPerKg ? parseFloat(formData.shipping.costPerKg) : undefined,
          processingTime: formData.shipping.processingTime,
        },
        seo: formData.seo,
        status: isDraft ? "draft" : formData.status,
        variants: formData.variants.map(v => ({
          ...v,
          price: v.price ? parseFloat(String(v.price)) : undefined,
          stock: v.stock ? parseInt(String(v.stock)) : undefined,
          weight: v.weight ? parseFloat(String(v.weight)) : undefined,
          image: v.image || undefined,
        })),
        shop: userShop._id || userShop.id,
      };

      const response = await sellerApi.createProduct(productData);

      if (response?.success !== false) {
        toast.success(
          `Product ${isDraft ? "saved as draft" : "published"} successfully!`
        );
        router.push("/seller/products");
      } else {
        toast.error(response?.message || response?.error || "Failed to create product");
      }
    } catch (error: any) {
      console.error("Product creation error:", error);
      toast.error(error?.message || "Failed to create product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasRequiredFields =
    !!formData.title.trim() &&
    !!formData.price.trim();

  return (
    <div className="min-h-screen bg-motif-blanc selection:bg-taja-primary/30">
      {/* Navigation - Actions Bar (fixed below seller header) */}
      <nav className="fixed top-[72px] left-0 right-0 z-40 border-b border-taja-primary/10 bg-white/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-10">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-6">
              <Link
                href="/seller/products"
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-taja-secondary/60 hover:text-taja-primary transition-all group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Products
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading || !hasRequiredFields || !canAddProducts}
                className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-taja-secondary/60 hover:text-taja-secondary hover:bg-white/40 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Draft
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e)}
                disabled={loading || !hasRequiredFields || !canAddProducts}
                className="flex items-center gap-3 px-8 py-3 bg-taja-secondary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-taja-primary" />}
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
        className="max-w-[1400px] mx-auto px-4 sm:px-10 pt-32 pb-12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-12">

            {/* Basic Information Section */}
            <motion.section variants={item} className="glass-panel p-10 border-white/60 rounded-[40px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-taja-primary/5 blur-[100px] rounded-full -z-10" />

              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Foundation</h3>
                  <p className="text-3xl font-black text-taja-secondary tracking-tighter italic">Basic Information</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={!formData.title.trim() || generatingDescription}
                    onClick={handleGenerateDescription}
                    className="flex items-center gap-2 px-4 py-2.5 glass-card border-white bg-white/20 hover:bg-white hover:shadow-premium-hover transition-all rounded-xl text-[10px] font-black uppercase tracking-widest text-taja-primary disabled:opacity-50"
                  >
                    {generatingDescription ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    AI: Improve Description
                  </button>
                  <button
                    type="button"
                    disabled={!formData.title.trim() || suggestingTags}
                    onClick={handleSuggestTags}
                    className="flex items-center gap-2 px-4 py-2.5 glass-card border-white bg-white/20 hover:bg-white hover:shadow-premium-hover transition-all rounded-xl text-[10px] font-black uppercase tracking-widest text-taja-primary disabled:opacity-50"
                  >
                    {suggestingTags ? <Loader2 className="h-3 w-3 animate-spin" /> : <Tag className="h-3 w-3" />}
                    AI: Suggest Tags
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                <div className="group space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                      Product Title *
                    </label>
                    {(analyzingImage || generatingDescription) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1 text-[8px] font-black text-taja-primary uppercase tracking-widest bg-taja-primary/10 px-2 py-0.5 rounded-full"
                      >
                        <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                        AI Magic
                      </motion.div>
                    )}
                  </div>
                  <input
                    name="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full h-16 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-lg font-bold text-taja-secondary placeholder:text-gray-300"
                    placeholder="e.g., Vintage Denim Jacket - Size M"
                  />
                </div>

                <div className="group space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                      Description *
                    </label>
                    {(analyzingImage || generatingDescription) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1 text-[8px] font-black text-taja-primary uppercase tracking-widest bg-taja-primary/10 px-2 py-0.5 rounded-full"
                      >
                        <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                        AI Magic
                      </motion.div>
                    )}
                  </div>
                  <textarea
                    name="description"
                    rows={8}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-3xl text-sm font-medium text-taja-secondary placeholder:text-gray-300 resize-none leading-relaxed"
                    placeholder="Describe your product in detail..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="group space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                        Category *
                      </label>
                      {analyzingImage && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-1 text-[8px] font-black text-taja-primary uppercase tracking-widest bg-taja-primary/10 px-2 py-0.5 rounded-full"
                        >
                          <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                          AI Magic
                        </motion.div>
                      )}
                    </div>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] text-taja-secondary appearance-none"
                    >
                      <option value="">Select category</option>
                      {allCategories.map((cat) => (
                        <option key={cat._id || cat.name} value={cat._id || cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="group space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                      Condition *
                    </label>
                    <select
                      name="condition"
                      required
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] text-taja-secondary appearance-none"
                    >
                      {conditions.map((cond) => (
                        <option key={cond.value} value={cond.value}>{cond.label} - {cond.desc}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Image Gallery Section */}
            <motion.section variants={item} className="glass-panel p-10 border-white/60 rounded-[40px]">
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Visual Assets</h3>
                  <p className="text-3xl font-black text-taja-secondary tracking-tighter italic">Product Images *</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formData.images.length} / 8 Uploaded</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <AnimatePresence>
                  {formData.images.map((image, index) => (
                    <motion.div
                      key={index}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`relative aspect-square group glass-card overflow-hidden rounded-[32px] p-1 border-2 transition-all ${index === 0 ? 'border-taja-primary shadow-emerald' : 'border-white/60'}`}
                    >
                      <Image
                        src={image}
                        alt={`Product ${index + 1}`}
                        fill
                        className="object-cover rounded-[28px]"
                      />
                      <div className="absolute inset-0 bg-taja-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                        {index === 0 && (
                          <button
                            type="button"
                            onClick={() => handleAnalyzeImage(image)}
                            className="w-full py-2 glass-card bg-taja-primary text-[9px] font-black uppercase tracking-widest text-white hover:bg-taja-primary/80 transition-all rounded-xl flex items-center justify-center gap-1"
                          >
                            <Sparkles className="h-3 w-3" />
                            Analyze with AI
                          </button>
                        )}
                        {index !== 0 && (
                          <button
                            type="button"
                            onClick={() => setMainImage(index)}
                            className="w-full py-2 glass-card bg-white text-[9px] font-black uppercase tracking-widest text-taja-secondary hover:bg-taja-primary hover:text-white transition-all rounded-xl"
                          >
                            Set Main
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="w-full py-2 glass-card bg-red-500 text-[9px] font-black uppercase tracking-widest text-white hover:bg-red-600 transition-all rounded-xl"
                        >
                          Delete
                        </button>
                      </div>
                      {index === 0 && (
                        <div className="absolute top-4 left-4 h-6 px-3 glass-card bg-taja-primary border-white/40 flex items-center gap-1.5 shadow-premium">
                          <Star className="h-3 w-3 text-white fill-current" />
                          <span className="text-[8px] font-black text-white uppercase tracking-widest">Primary</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {formData.images.length < 8 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      } else {
                        document.getElementById("seller-product-image-input")?.click();
                      }
                    }}
                    disabled={uploadingImages}
                    className="aspect-square flex flex-col items-center justify-center p-8 glass-card border-dashed border-white/60 bg-white/10 hover:bg-white hover:shadow-premium transition-all duration-500 group rounded-[32px] cursor-pointer"
                  >
                    {uploadingImages ? (
                      <Loader2 className="h-8 w-8 text-taja-primary animate-spin" />
                    ) : (
                      <>
                        <div className="p-4 rounded-2xl bg-gray-50 group-hover:bg-taja-primary group-hover:text-white transition-all duration-500 mb-4">
                          <Camera className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Upload Media</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="mt-8 p-6 glass-card bg-taja-primary/5 border-taja-primary/20 rounded-3xl">
                <p className="text-[10px] font-bold text-taja-primary leading-relaxed text-center uppercase tracking-widest">
                  Tip: The first image is the star of the show. Aim for high-resolution, cinematic shots.
                </p>
              </div>
            </motion.section>

            {/* Product Details Section */}
            <motion.section variants={item} className="glass-panel p-10 border-white/60 rounded-[40px]">
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Specifications</h3>
                  <p className="text-3xl font-black text-taja-secondary tracking-tighter italic">Product Details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Brand (Optional)
                  </label>
                  <input
                    name="specifications.brand"
                    type="text"
                    value={formData.specifications.brand}
                    onChange={handleChange}
                    className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-bold text-taja-secondary"
                  />
                </div>
                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Material (Optional)
                  </label>
                  <input
                    name="specifications.material"
                    type="text"
                    value={formData.specifications.material}
                    onChange={handleChange}
                    className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-bold text-taja-secondary"
                    placeholder="e.g., Cotton, Leather, Denim"
                  />
                </div>
              </div>

              {/* Dynamic Specifications */}
              {formData.category && (
                <div className="space-y-8 mt-8 pt-8 border-t border-white/20">
                  {/* Fashion Fields */}
                  {(categoryFields[formData.category] || categoryFields["Fashion"]).includes("size") && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                      <div className="group space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Size</label>
                        <select
                          name="specifications.size"
                          value={formData.specifications.size}
                          onChange={handleChange}
                          className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white appearance-none transition-all rounded-2xl text-[11px] font-black uppercase tracking-widest text-taja-secondary"
                        >
                          <option value="">Select size</option>
                          {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="group space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Color</label>
                        <select
                          name="specifications.color"
                          value={formData.specifications.color}
                          onChange={handleChange}
                          className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white appearance-none transition-all rounded-2xl text-[11px] font-black uppercase tracking-widest text-taja-secondary"
                        >
                          <option value="">Select color</option>
                          {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="group space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Gender</label>
                        <select
                          name="specifications.gender"
                          value={formData.specifications.gender}
                          onChange={handleChange}
                          className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white appearance-none transition-all rounded-2xl text-[11px] font-black uppercase tracking-widest text-taja-secondary"
                        >
                          <option value="">Select gender</option>
                          <option value="men">Men</option>
                          <option value="women">Women</option>
                          <option value="unisex">Unisex</option>
                          <option value="kids">Kids</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Electronics Fields */}
                  {categoryFields[formData.category]?.includes("model") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="group space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Model Name/Number</label>
                        <input
                          name="specifications.model"
                          type="text"
                          value={formData.specifications.model}
                          onChange={handleChange}
                          className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-sm font-bold text-taja-secondary"
                          placeholder="e.g., iPhone 15 Pro"
                        />
                      </div>
                      <div className="group space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Warranty Period</label>
                        <input
                          name="specifications.warranty"
                          type="text"
                          value={formData.specifications.warranty}
                          onChange={handleChange}
                          className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-sm font-bold text-taja-secondary"
                          placeholder="e.g., 1 Year Local Warranty"
                        />
                      </div>
                      <div className="group space-y-2 sm:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Technical Specifications</label>
                        <textarea
                          name="specifications.technicalSpecs"
                          rows={4}
                          value={formData.specifications.technicalSpecs}
                          onChange={handleChange}
                          className="w-full p-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-sm font-medium text-taja-secondary resize-none"
                          placeholder="e.g., 8GB RAM, 256GB SSD, OLED Display..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Medicines Fields */}
                  {categoryFields[formData.category]?.includes("expiryDate") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="group space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Manufacturer</label>
                        <input
                          name="specifications.manufacturer"
                          type="text"
                          value={formData.specifications.manufacturer}
                          onChange={handleChange}
                          className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-sm font-bold text-taja-secondary"
                          placeholder="e.g., Pfizer, GSK"
                        />
                      </div>
                      <div className="group space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Expiry Date</label>
                        <input
                          name="specifications.expiryDate"
                          type="date"
                          value={formData.specifications.expiryDate}
                          onChange={handleChange}
                          className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-sm font-bold text-taja-secondary"
                        />
                      </div>
                      <div className="group space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Dosage Instructions</label>
                        <input
                          name="specifications.dosage"
                          type="text"
                          value={formData.specifications.dosage}
                          onChange={handleChange}
                          className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-sm font-bold text-taja-secondary"
                          placeholder="e.g., 1 tablet twice daily"
                        />
                      </div>
                      <div className="group space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Active Ingredients</label>
                        <input
                          name="specifications.ingredients"
                          type="text"
                          value={formData.specifications.ingredients}
                          onChange={handleChange}
                          className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-sm font-bold text-taja-secondary"
                          placeholder="e.g., Paracetamol 500mg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.section>

            {/* Product Variations Section */}
            <motion.section
              variants={item}
              className="glass-panel p-6 sm:p-10 border-white/60 rounded-[30px] sm:rounded-[40px] bg-gradient-to-br from-white to-gray-50/30"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">
                    Product Options
                  </h3>
                  <p className="text-2xl sm:text-3xl font-black text-taja-secondary tracking-tighter italic">
                    Variations
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addVariant}
                  variant="outline"
                  className="rounded-2xl border-taja-primary/20 text-taja-primary hover:bg-taja-primary hover:text-white transition-all font-black uppercase tracking-widest text-[10px] h-12 px-6 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variation
                </Button>
              </div>

              <input
                ref={variantImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-hidden
                onChange={handleVariantImageUpload}
              />
              {formData.variants.length > 0 ? (
                <div className="space-y-10">
                  <AnimatePresence>
                    {formData.variants.map((variant, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative p-8 glass-card bg-white border-white/60 rounded-[2.5rem] shadow-sm hover:shadow-huge transition-all group"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
                          {/* Name Input */}
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              Variation Name
                            </label>
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => updateVariant(index, "name", e.target.value)}
                              placeholder="Red / XL"
                              className="w-full h-16 px-6 bg-gray-50/50 border border-gray-100 focus:border-taja-primary focus:bg-white focus:ring-8 focus:ring-taja-primary/5 transition-all rounded-[20px] text-lg font-bold text-taja-secondary shadow-sm"
                            />
                          </div>

                          {/* Price Input */}
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              Price (₦)
                            </label>
                            <input
                              type="number"
                              value={variant.price}
                              onChange={(e) => updateVariant(index, "price", e.target.value)}
                              placeholder="0"
                              className="w-full h-16 px-6 bg-gray-50/50 border border-gray-100 focus:border-taja-primary focus:bg-white focus:ring-8 focus:ring-taja-primary/5 transition-all rounded-[20px] text-xl font-black text-taja-primary text-center shadow-sm"
                            />
                          </div>

                          {/* Stock Input */}
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              Stock
                            </label>
                            <input
                              type="number"
                              value={variant.stock}
                              onChange={(e) => updateVariant(index, "stock", e.target.value)}
                              placeholder="0"
                              className="w-full h-16 px-6 bg-gray-50/50 border border-gray-100 focus:border-taja-primary focus:bg-white focus:ring-8 focus:ring-taja-primary/5 transition-all rounded-[20px] text-lg font-bold text-taja-secondary text-center shadow-sm"
                            />
                          </div>

                          {/* Weight Input */}
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              Weight (kg)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={variant.weight}
                              onChange={(e) => updateVariant(index, "weight", e.target.value)}
                              placeholder="0"
                              className="w-full h-16 px-6 bg-gray-50/50 border border-gray-100 focus:border-taja-primary focus:bg-white focus:ring-8 focus:ring-taja-primary/5 transition-all rounded-[20px] text-base font-medium text-gray-500 text-center shadow-sm"
                            />
                          </div>

                          {/* Variant Image Section */}
                          <div className="sm:col-span-2 space-y-3 pt-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              Variant Image
                            </label>
                            <div className="flex flex-col sm:flex-row gap-6 items-center bg-gray-50/30 p-4 rounded-[2rem] border border-gray-100/50">
                              <div className="flex-shrink-0">
                                {variant.image ? (
                                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-premium">
                                    <img src={variant.image} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center gap-1 text-gray-300">
                                    <Camera className="w-6 h-6" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">No Image</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <select
                                  value={variant.image || ""}
                                  onChange={(e) => updateVariant(index, "image", e.target.value)}
                                  className="w-full h-14 px-6 bg-white border border-gray-100 focus:border-taja-primary focus:ring-8 focus:ring-taja-primary/5 transition-all rounded-xl text-xs font-bold text-taja-secondary appearance-none shadow-sm"
                                  disabled={uploadingVariantImage === index}
                                >
                                  <option value="">{formData.images.length ? "Side Photo / Main" : "Pick Image"}</option>
                                  {formData.images.map((url, idx) => (
                                    <option key={url} value={url}>Side Photo {idx + 1}</option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  onClick={() => {
                                    variantImageIndexRef.current = index;
                                    variantImageInputRef.current?.click();
                                  }}
                                  disabled={uploadingVariantImage !== null || formData.images.length >= 8}
                                  className="flex items-center justify-center gap-2 h-14 px-6 rounded-xl border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-taja-secondary hover:bg-gray-50 hover:border-taja-primary transition-all shadow-sm disabled:opacity-50"
                                >
                                  {uploadingVariantImage === index ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-taja-primary" />
                                  ) : (
                                    <Plus className="h-5 w-5" />
                                  )}
                                  {uploadingVariantImage === index ? "Wait..." : "New Photo"}
                                </button>
                              </div>
                            </div>
                            {formData.images.length === 0 && (
                              <p className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 leading-snug mt-2">
                                Add product images above, or upload a variant-specific image.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Absolute Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="absolute -top-3 -right-3 w-10 h-10 flex items-center justify-center bg-white text-rose-500 hover:bg-rose-500 hover:text-white rounded-full transition-all shadow-huge border border-gray-100 z-10 group/del"
                        >
                          <X className="h-5 w-5 transition-transform group-hover/del:scale-110" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/30">
                  <div className="w-16 h-16 rounded-3xl bg-white shadow-premium flex items-center justify-center mb-6">
                    <LayoutGrid className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
                    No Variations Defined
                  </p>
                  <Button
                    type="button"
                    onClick={addVariant}
                    variant="outline"
                    className="rounded-2xl border-gray-200 text-gray-400 hover:border-taja-primary hover:text-taja-primary transition-all font-black uppercase tracking-widest text-[10px] h-10 px-6 bg-white"
                  >
                    Add Your First Variation
                  </Button>
                </div>
              )}

              <div className="mt-10 p-6 rounded-3xl bg-blue-50/50 border border-blue-100/50 flex items-start gap-4">
                <div className="p-2 bg-blue-500 rounded-lg shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <p className="text-[10px] font-bold text-blue-900 leading-relaxed uppercase tracking-widest">
                  Variations allow you to offer different sizes, colors, or versions of your product, each with its own price and stock
                  levels. This increases conversion by providing more choices to elite buyers.
                </p>
              </div>
            </motion.section>

          </div >

  <div className="lg:col-span-4 space-y-12">

    {/* Pricing Card */}
    <motion.section variants={item} className="glass-panel p-8 border-white/60 rounded-[40px] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] rounded-full -z-10" />
      <div className="flex items-center gap-3 mb-8">
        <DollarSign className="h-5 w-5 text-taja-primary" />
        <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Exchange Protocol</h3>
      </div>

      <div className="space-y-6">
        <div className="group space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
              {formData.variants.length > 0 ? "Base price (₦) *" : "Price (₦) *"}
            </label>
            {suggestedPrice && (
              <div className="text-[8px] font-bold text-taja-primary bg-taja-primary/5 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Sparkles className="h-2 w-2" />
                AI Suggests: {suggestedPrice}
              </div>
            )}
          </div>
          <input
            name="price"
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            className="w-full h-16 px-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-2xl font-black tracking-tighter text-taja-secondary"
            placeholder="0.00"
          />
          {formData.variants.length > 0 && (
            <p className="text-[10px] font-medium text-gray-400 leading-relaxed">
              Set each variation’s price below; the storefront shows a range from this base (if it’s the lowest) up to the highest variant price.
            </p>
          )}
        </div>
        <div className="group space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Compare at Price (₦)</label>
          <input
            name="compareAtPrice"
            type="number"
            min="0"
            step="0.01"
            value={formData.compareAtPrice}
            onChange={handleChange}
            className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-sm font-bold text-gray-400"
            placeholder="Original price if on sale"
          />
        </div>
      </div>
    </motion.section>

    {/* Inventory Card */}
    <motion.section variants={item} className="glass-panel p-8 border-white/60 rounded-[40px]">
      <div className="flex items-center gap-3 mb-8">
        <Package className="h-5 w-5 text-blue-500" />
        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Stock Intelligence</h3>
      </div>

      <div className="space-y-6">
        <label className="flex items-center gap-4 cursor-pointer group p-2 rounded-xl hover:bg-white/40 transition-all">
          <div className="relative">
            <input
              type="checkbox"
              name="inventory.trackQuantity"
              checked={formData.inventory.trackQuantity}
              onChange={handleChange}
              className="peer hidden"
            />
            <div className="w-10 h-6 bg-gray-200 peer-checked:bg-taja-primary rounded-full transition-all duration-300 shadow-inner" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-4 shadow-sm" />
          </div>
          <span className="text-[10px] font-black text-taja-secondary uppercase tracking-widest">Track Inventory</span>
        </label>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Minimum order quantity (MOQ)</label>
          <input
            name="inventory.moq"
            type="number"
            min="1"
            value={formData.inventory.moq}
            onChange={handleChange}
            className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-sm font-bold text-taja-secondary"
          />
        </motion.div>
        {formData.inventory.trackQuantity && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Quantity Available</label>
            <input
              name="inventory.quantity"
              type="number"
              min="0"
              value={formData.inventory.quantity}
              onChange={handleChange}
              className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-lg font-black text-taja-secondary"
            />
          </motion.div>
        )}
      </div>
    </motion.section>

    {/* Shipping Card */}
    <motion.section variants={item} className="glass-panel p-8 border-white/60 rounded-[40px]">
      <div className="flex items-center gap-3 mb-8">
        <Truck className="h-5 w-5 text-purple-500" />
        <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Logistics Protocol</h3>
      </div>

      <div className="space-y-6">
        <label className="flex items-center gap-4 cursor-pointer group p-2 rounded-xl hover:bg-white/40 transition-all">
          <div className="relative">
            <input
              type="checkbox"
              name="shipping.freeShipping"
              checked={formData.shipping.freeShipping}
              onChange={handleChange}
              className="peer hidden"
            />
            <div className="w-10 h-6 bg-gray-200 peer-checked:bg-emerald-500 rounded-full transition-all duration-300  shadow-inner" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-4 shadow-sm" />
          </div>
          <span className="text-[10px] font-black text-taja-secondary uppercase tracking-widest">Free Shipping</span>
        </label>

        {!formData.shipping.freeShipping && (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Delivery Fee (₦) — flat rate</label>
              <input
                name="shipping.shippingCost"
                type="number"
                min="0"
                value={formData.shipping.shippingCost}
                onChange={handleChange}
                className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-sm font-bold text-taja-secondary"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Or cost per kg (₦) — weight-based</label>
              <input
                name="shipping.costPerKg"
                type="number"
                min="0"
                step="0.01"
                value={formData.shipping.costPerKg}
                onChange={handleChange}
                placeholder="Optional: logistics-style pricing"
                className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-sm font-bold text-taja-secondary"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Weight (kg)</label>
              <input
                name="shipping.weight"
                type="number"
                min="0"
                step="0.01"
                value={formData.shipping.weight}
                onChange={handleChange}
                placeholder="For weight-based delivery"
                className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white transition-all rounded-2xl text-sm font-bold text-taja-secondary"
              />
            </motion.div>
          </>
        )}

        <div className="group space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Processing Time</label>
          <select
            name="shipping.processingTime"
            value={formData.shipping.processingTime}
            onChange={handleChange}
            className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white appearance-none transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest text-taja-secondary"
          >
            <option value="1-2-days">1-2 Business Days</option>
            <option value="3-5-days">3-5 Business Days</option>
            <option value="1-week">1 Week Execution</option>
            <option value="2-weeks">2 Weeks Strategy</option>
          </select>
        </div>
      </div>
    </motion.section>

    {/* SEO & Tags Card */}
    <motion.section variants={item} className="glass-panel p-8 border-white/60 rounded-[40px]">
      <div className="flex items-center gap-3 mb-8">
        <Target className="h-5 w-5 text-amber-600" />
        <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">Discovery Engine</h3>
      </div>

      <div className="space-y-6">
        <div className="group space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Marketplace Context Tags</label>
          <div className="relative group/input">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="w-full h-14 pl-6 pr-32 glass-panel border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-sm font-bold text-taja-secondary placeholder:text-gray-300 shadow-premium"
              placeholder="Add discovery tag..."
            />
            <button
              type="button"
              onClick={addTag}
              className="absolute right-2 top-2 h-10 px-6 bg-taja-secondary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-taja-primary transition-all shadow-premium group-hover/input:scale-95 active:scale-90"
            >
              Sync
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 min-h-[40px]">
          <AnimatePresence initial={false}>
            {formData.seo.tags.map((tag) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="inline-flex items-center px-5 py-2.5 glass-panel bg-white/80 border-taja-primary/10 text-taja-secondary text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm hover:shadow-md hover:border-taja-primary/30 transition-all group/tag select-none"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-3 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          {formData.seo.tags.length === 0 && (
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest italic pt-2">No tags synchronized yet.</p>
          )}
        </div>
      </div>
    </motion.section>

  </div>
        </div >
      </motion.div >

      <input
        id="seller-product-image-input"
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
        className="hidden"
      />

      <ShopRequirementModal open={!checkingShop && !hasShop} />
    </div >
  );
}




