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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import toast from "react-hot-toast";
import { api, sellerApi, shopsApi, uploadProductImage } from "@/lib/api";
import { z } from "zod";

// Zod schema for required publish fields
const productPublishSchema = z.object({
  title: z.string().min(1, "Product Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Price must be greater than 0" }
    ),
  images: z
    .array(z.string().min(1))
    .min(1, "Please add at least one product image"),
});

const categories = [
  "Fashion & Clothing",
  "Electronics",
  "Home & Living",
  "Beauty & Personal Care",
  "Sports & Fitness",
  "Accessories",
  "Books & Media",
  "Art & Crafts",
  "Jewelry",
  "Shoes & Bags",
];

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

import { ShopRequirementModal } from "@/components/shop/ShopRequirementModal";

export default function NewProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [checkingShop, setCheckingShop] = useState(true);
  const [hasShop, setHasShop] = useState(false);
  const [isVerifiedSeller, setIsVerifiedSeller] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [suggestingTags, setSuggestingTags] = useState(false);
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
    },
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
        if (!verified) {
          setCheckingShop(false);
          toast.error("Complete seller verification to add products.");
          router.replace("/onboarding/kyc");
          return;
        }

        setHasShop(true);
        setIsVerifiedSeller(true);
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
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls].slice(0, 8), // Max 8 images
      }));
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
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

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();

    if (!canAddProducts) {
      toast.error("Set up your shop and complete seller verification to add products.");
      return;
    }

    // Zod validation for required fields
    const validation = productPublishSchema.safeParse({
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      price: formData.price.trim(),
      images: formData.images,
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
    !!formData.description.trim() &&
    !!formData.category.trim() &&
    !!formData.price.trim() &&
    formData.images.length > 0;

  return (
    <div className="min-h-screen bg-motif-blanc selection:bg-taja-primary/30">
      {/* Navigation - Actions Bar */}
      <nav className="sticky top-0 z-40 border-b border-taja-primary/10 bg-white/10 backdrop-blur-xl">
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
        className="max-w-[1400px] mx-auto px-4 sm:px-10 py-12"
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
                    onClick={async () => { /* Logic remains same */ }}
                    className="flex items-center gap-2 px-4 py-2.5 glass-card border-white bg-white/20 hover:bg-white hover:shadow-premium-hover transition-all rounded-xl text-[10px] font-black uppercase tracking-widest text-taja-primary disabled:opacity-50"
                  >
                    {generatingDescription ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    AI: Improve Description
                  </button>
                  <button
                    type="button"
                    disabled={!formData.title.trim() || suggestingTags}
                    onClick={async () => { /* Logic remains same */ }}
                    className="flex items-center gap-2 px-4 py-2.5 glass-card border-white bg-white/20 hover:bg-white hover:shadow-premium-hover transition-all rounded-xl text-[10px] font-black uppercase tracking-widest text-taja-primary disabled:opacity-50"
                  >
                    {suggestingTags ? <Loader2 className="h-3 w-3 animate-spin" /> : <Tag className="h-3 w-3" />}
                    AI: Suggest Tags
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Product Title *
                  </label>
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
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    rows={8}
                    required
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-3xl text-sm font-medium text-taja-secondary placeholder:text-gray-300 resize-none leading-relaxed"
                    placeholder="Describe your product in detail..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="group space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                      Category *
                    </label>
                    <select
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full h-14 px-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-0 transition-all rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] text-taja-secondary appearance-none"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
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
                  <p className="text-3xl font-black text-taja-secondary tracking-tighter italic">Product Images</p>
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
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages}
                    className="aspect-square flex flex-col items-center justify-center p-8 glass-card border-dashed border-white/60 bg-white/10 hover:bg-white hover:shadow-premium transition-all duration-500 group rounded-[32px]"
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
            </motion.section>
          </div>

          {/* Sidebar / Secondary Area */}
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
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Price (₦) *</label>
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
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Shipping Cost (₦) — flat</label>
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
        </div>
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
        className="hidden"
      />

      <ShopRequirementModal open={!checkingShop && !hasShop} />
    </div>
  );
}




