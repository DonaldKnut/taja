"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  ChevronRight,
  Zap,
  ShieldCheck,
  TrendingUp,
  LayoutGrid,
  Settings,
  AlertCircle,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { api, sellerApi, uploadProductImage } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    condition: "new" as "new" | "like-new" | "good" | "fair" | "poor",
    price: "",
    maxPrice: "",
    isRange: false,
    compareAtPrice: "",
    currency: "NGN",
    images: [] as string[],
    specifications: {} as Record<string, any>,
    inventory: {
      quantity: 1,
      sku: "",
      trackQuantity: true,
      moq: 1,
    },
    shipping: {
      weight: "",
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
      },
      freeShipping: false,
      shippingCost: "",
      processingTime: "1-2-days" as "1-2-days" | "3-5-days" | "1-week" | "2-weeks",
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
      active: boolean;
    }[],
    status: "active" as "active" | "draft",
  });

  const [tagInput, setTagInput] = useState("");

  // Fetch categories and product data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setFetching(true);

        // Fetch Categories
        const categoriesRes = await api("/api/categories");
        if (categoriesRes?.data) {
          setCategories(categoriesRes.data);
        }

        if (!productId) return;

        // Fetch Product
        const response = await sellerApi.getProduct(productId);

        let productData;
        if (response?.data?.product) {
          productData = response.data.product;
        } else if (response?.data) {
          productData = response.data;
        } else if (response?.product) {
          productData = response.product;
        } else {
          productData = response;
        }

        // Transform API response to match our form structure
        setFormData({
          title: productData.name || productData.title || "",
          description: productData.description || "",
          category: typeof productData.category === 'object' ? productData.category._id : productData.category || "",
          subcategory: productData.subcategory || "",
          condition: productData.condition || "new",
          price: String(productData.price || ""),
          maxPrice: String(productData.maxPrice || ""),
          isRange: !!productData.maxPrice,
          compareAtPrice: productData.compareAtPrice || productData.originalPrice ? String(productData.compareAtPrice || productData.originalPrice) : "",
          currency: productData.currency || "NGN",
          images: productData.images || [],
          specifications: productData.specifications || {},
          inventory: {
            quantity: productData.inventory?.quantity ?? productData.stock ?? 1,
            sku: productData.inventory?.sku || productData.sku || "",
            trackQuantity: productData.inventory?.trackQuantity !== false,
            moq: productData.inventory?.moq || productData.moq || 1,
          },
          shipping: {
            weight: productData.shipping?.weight ? String(productData.shipping.weight) : "",
            dimensions: productData.shipping?.dimensions || { length: 0, width: 0, height: 0 },
            freeShipping: productData.shipping?.freeShipping || false,
            shippingCost: productData.shipping?.shippingCost ? String(productData.shipping.shippingCost) : "",
            processingTime: productData.shipping?.processingTime || "1-2-days",
          },
          seo: {
            tags: productData.seo?.tags || productData.tags || [],
            metaTitle: productData.seo?.metaTitle || productData.metaTitle || "",
            metaDescription: productData.seo?.metaDescription || productData.metaDescription || "",
          },
          status: productData.status || "active",
          variants: (productData.variants || []).map((v: any) => ({
            ...v,
            price: String(v.price || ""),
            stock: String(v.stock || ""),
            weight: String(v.weight || ""),
          })),
        });
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        toast.error(error?.message || "Failed to load product information");
      } finally {
        setFetching(false);
      }
    };

    fetchInitialData();
  }, [productId, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (name.includes(".")) {
      const parts = name.split(".");
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
          },
        }));
      } else if (parts.length === 3) {
        const [parent, mid, child] = parts;
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [mid]: {
              ...(prev as any)[parent][mid],
              [child]: value
            }
          }
        }));
      }
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
        const url = await uploadProductImage(file);
        return url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls].slice(0, 8),
      }));
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
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
    if (index === 0) return;
    setFormData((prev) => {
      const newImages = [...prev.images];
      const [removed] = newImages.splice(index, 1);
      newImages.unshift(removed);
      return { ...prev, images: newImages };
    });
    toast.success("Main image updated");
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

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();

    if (!formData.title || !formData.category || !formData.price || formData.images.length === 0) {
      toast.error("Please fill in title, category, price and at least one image");
      return;
    }

    setLoading(true);

    try {
      // Clean data to avoid CastErrors
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        condition: formData.condition,
        price: parseFloat(formData.price),
        maxPrice: formData.isRange && formData.maxPrice ? parseFloat(formData.maxPrice) : undefined,
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        currency: formData.currency,
        images: formData.images,
        specifications: formData.specifications,
        inventory: {
          quantity: Number(formData.inventory.quantity),
          sku: formData.inventory.sku || undefined,
          trackQuantity: formData.inventory.trackQuantity,
          moq: Number(formData.inventory.moq) || 1,
        },
        shipping: {
          weight: formData.shipping.weight ? parseFloat(formData.shipping.weight) : 0,
          dimensions: {
            length: Number(formData.shipping.dimensions?.length) || 0,
            width: Number(formData.shipping.dimensions?.width) || 0,
            height: Number(formData.shipping.dimensions?.height) || 0,
          },
          freeShipping: formData.shipping.freeShipping,
          shippingCost: formData.shipping.shippingCost ? parseFloat(formData.shipping.shippingCost) : 0,
          processingTime: formData.shipping.processingTime,
        },
        seo: {
          tags: formData.seo.tags,
          metaTitle: formData.seo.metaTitle || undefined,
          metaDescription: formData.seo.metaDescription || undefined,
        },
        status: isDraft ? "draft" : "active",
        variants: formData.variants.map(v => ({
          ...v,
          price: v.price ? parseFloat(v.price) : undefined,
          stock: v.stock ? parseInt(v.stock) : undefined,
          weight: v.weight ? parseFloat(v.weight) : undefined,
        })),
      };

      const response = await api(`/api/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      if (response?.success) {
        toast.success(`Product ${isDraft ? "saved as draft" : "updated"} successfully!`);
        router.push("/seller/products");
      } else {
        toast.error(response?.message || "Failed to update product");
      }
    } catch (error: any) {
      console.error("Product update error:", error);
      toast.error(error?.message || "An error occurred while updating");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-taja-light animate-pulse"></div>
            <div className="absolute inset-0 h-16 w-16 rounded-full border-t-4 border-taja-primary animate-spin"></div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Restoring Masterpiece...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-32">
      <AppHeader />

      <main className="relative z-10 pt-8">
        <Container size="lg">
          {/* Enhanced Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 px-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href="/seller/products"
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div className="h-1 w-8 bg-taja-primary rounded-full"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-taja-primary">Product Editor</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-taja-secondary tracking-tighter leading-none">
                Refining {formData.title || "Your Product"}
              </h1>
              <p className="text-gray-400 font-medium text-sm">Perfecting the presentation for your elite customers.</p>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="outline"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-xs border-gray-200"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading}
                className="rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-xs shadow-premium bg-gradient-to-r from-taja-primary to-emerald-700 hover:scale-[1.02] transition-transform"
              >
                {loading ? "Updating..." : "Publish Edits"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-8 space-y-10">
              {/* Media Section */}
              <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-taja-primary/10 rounded-2xl">
                    <Camera className="w-5 h-5 text-taja-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-taja-secondary tracking-tight">Visual Identity</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main gallery & showcase</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {formData.images.map((image, index) => (
                    <motion.div
                      layout
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "group relative aspect-square rounded-3xl overflow-hidden border-2 transition-all duration-500",
                        index === 0 ? "border-taja-primary ring-4 ring-taja-primary/10" : "border-transparent"
                      )}
                    >
                      <Image src={image} alt={`Preview ${index}`} fill className="object-cover" />

                      {index === 0 && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-taja-primary rounded-full flex items-center gap-1 shadow-lg">
                          <Star className="w-2.5 h-2.5 text-white fill-white" />
                          <span className="text-[8px] font-black text-white uppercase tracking-tighter">Main</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {index !== 0 && (
                          <button
                            type="button"
                            onClick={() => setMainImage(index)}
                            className="p-2 bg-white rounded-xl text-taja-secondary hover:text-taja-primary transition-colors"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-2 bg-red-500 rounded-xl text-white hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {formData.images.length < 8 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages}
                      className="aspect-square rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors group"
                    >
                      {uploadingImages ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-taja-primary border-t-transparent"></div>
                      ) : (
                        <>
                          <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-white transition-colors">
                            <Upload className="w-5 h-5 text-gray-400 group-hover:text-taja-primary transition-colors" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-3">Add More</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                />

                <div className="p-4 bg-taja-light/30 rounded-2xl border border-taja-primary/5">
                  <p className="text-[10px] font-bold text-taja-secondary leading-relaxed">
                    <span className="text-taja-primary mr-1 italic">PRO TIP:</span>
                    Premium buyers favor products with at least 5 studio-quality images. The first image serves as the cinematic hero of your listing.
                  </p>
                </div>
              </section>

              {/* Core Information */}
              <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-emerald-500/10 rounded-2xl">
                    <Package className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-taja-secondary tracking-tight">Core Details</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Essential specifications</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">Product Title</label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Wellwoman Multivitamin Premium"
                      className="rounded-2xl h-14 text-lg font-bold border-gray-100 focus:border-taja-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-taja-primary/20 focus:border-taja-primary transition-all font-medium text-gray-600"
                      placeholder="Describe the premium value of this item..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full h-14 px-5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-taja-primary/20 focus:border-taja-primary transition-all font-bold text-taja-secondary appearance-none"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">Condition</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["new", "like-new", "good", "fair"].map((cond) => (
                          <button
                            key={cond}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, condition: cond as any }))}
                            className={cn(
                              "h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                              formData.condition === cond
                                ? "bg-taja-secondary border-taja-secondary text-white shadow-lg"
                                : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                            )}
                          >
                            {cond.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Product Variations Section */}
              <section className="glass-panel p-6 sm:p-10 border-white/60 rounded-[30px] sm:rounded-[40px] mt-10 shadow-premium bg-gradient-to-br from-white to-gray-50/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-taja-primary/10 rounded-2xl hidden sm:block">
                      <LayoutGrid className="w-5 h-5 text-taja-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-taja-secondary tracking-tight italic">Product Options</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Variations</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={addVariant}
                    variant="outline"
                    className="rounded-2xl border-taja-primary/20 text-taja-primary hover:bg-taja-primary hover:text-white transition-all font-black uppercase tracking-widest text-[10px] h-12 px-6 w-full sm:w-auto flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>

                {formData.variants.length > 0 ? (
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
                      {formData.variants.map((variant, index) => (
                        <motion.div
                          key={index}
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
                                value={variant.name}
                                onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                placeholder="e.g. Red / XL"
                                className="w-full h-12 sm:h-11 px-4 bg-gray-50/50 border border-transparent focus:border-taja-primary/20 focus:bg-white focus:ring-4 focus:ring-taja-primary/5 transition-all rounded-xl text-sm sm:text-xs font-bold text-taja-secondary"
                              />
                            </div>

                            {/* Price Input */}
                            <div className="sm:col-span-2 space-y-2 sm:space-y-0">
                              <label className="sm:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (₦)</label>
                              <input
                                type="number"
                                value={variant.price}
                                onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                placeholder="Same as base"
                                className="w-full h-12 sm:h-11 px-4 bg-gray-50/50 border border-transparent focus:border-taja-primary/20 focus:bg-white focus:ring-4 focus:ring-taja-primary/5 transition-all rounded-xl text-sm sm:text-xs font-black text-taja-primary"
                              />
                            </div>

                            {/* Stock Input */}
                            <div className="sm:col-span-2 space-y-2 sm:space-y-0">
                              <label className="sm:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock</label>
                              <input
                                type="number"
                                value={variant.stock}
                                onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                                className="w-full h-12 sm:h-11 px-4 bg-gray-50/50 border border-transparent focus:border-taja-primary/20 focus:bg-white focus:ring-4 focus:ring-taja-primary/5 transition-all rounded-xl text-sm sm:text-xs font-bold text-taja-secondary"
                              />
                            </div>

                            {/* Weight Input */}
                            <div className="sm:col-span-3 space-y-2 sm:space-y-0">
                              <label className="sm:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Weight (kg)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={variant.weight}
                                onChange={(e) => updateVariant(index, 'weight', e.target.value)}
                                placeholder="Weight"
                                className="w-full h-12 sm:h-11 px-4 bg-gray-50/50 border border-transparent focus:border-taja-primary/20 focus:bg-white focus:ring-4 focus:ring-taja-primary/5 transition-all rounded-xl text-sm sm:text-xs font-medium text-gray-400"
                              />
                            </div>

                            {/* Remove Button */}
                            <div className="sm:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeVariant(index)}
                                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              >
                                <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem] sm:rounded-[2.5rem] bg-gray-50/30">
                    <div className="w-16 h-16 rounded-3xl bg-white shadow-premium flex items-center justify-center mb-6">
                      <LayoutGrid className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 text-center px-4">No product options defined yet</p>
                    <Button
                      type="button"
                      onClick={addVariant}
                      className="rounded-2xl border-gray-200 text-gray-400 hover:border-taja-primary hover:text-taja-primary transition-all font-black uppercase tracking-widest text-[10px] h-10 px-6 bg-white"
                      variant="outline"
                    >
                      Define Options
                    </Button>
                  </div>
                )}

                <div className="mt-8 sm:mt-10 p-4 sm:p-6 rounded-3xl bg-blue-50/50 border border-blue-100/50 flex flex-col sm:flex-row items-start gap-4">
                  <div className="p-2 bg-blue-500 rounded-lg shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[10px] font-bold text-blue-900 leading-relaxed uppercase tracking-widest mt-1">
                    Variations allow you to offer different sizes, colors, or versions of your product, each with its own price and stock levels. This increases conversion by providing more choices to elite buyers.
                  </p>
                </div>
              </section>


              {/* Pricing Section */}
              <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/10 rounded-2xl">
                      <Zap className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-taja-secondary tracking-tight">Standard Pricing</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue model</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Price Range</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isRange: !prev.isRange }))}
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        formData.isRange ? "bg-taja-primary" : "bg-gray-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform",
                        formData.isRange ? "translate-x-5" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">
                        {formData.isRange ? "Minimum (₦)" : "Price (₦)"}
                      </label>
                      <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-300">₦</span>
                        <Input
                          name="price"
                          type="number"
                          value={formData.price}
                          onChange={handleChange}
                          className="rounded-2xl h-16 pl-12 text-xl font-black border-gray-100 focus:border-taja-primary transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {formData.isRange && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">Maximum (₦)</label>
                        <div className="relative group">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-300">₦</span>
                          <Input
                            name="maxPrice"
                            type="number"
                            value={formData.maxPrice}
                            onChange={handleChange}
                            className="rounded-2xl h-16 pl-12 text-xl font-black border-gray-100 focus:border-taja-primary transition-all text-taja-primary"
                            placeholder="0.00"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">Compare At (₦)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-200 text-sm">Was N</span>
                      <Input
                        name="compareAtPrice"
                        type="number"
                        value={formData.compareAtPrice}
                        onChange={handleChange}
                        className="rounded-2xl h-16 pl-16 text-lg font-medium text-gray-400 border-gray-100 line-through ring-0 focus:ring-0 focus:border-gray-200"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-widest">
                        Setting a "Compare At" price higher than your actual price creates an elite value perception for buyers.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column - Side Panels */}
            <div className="lg:col-span-4 space-y-8">
              {/* Inventory Control */}
              <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-blue-500/10 rounded-2xl">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-lg font-black text-taja-secondary tracking-tight">Stock Logistics</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-2 block">In Stock</label>
                    <Input
                      name="inventory.quantity"
                      type="number"
                      value={formData.inventory.quantity}
                      onChange={handleChange}
                      className="rounded-xl h-14 font-black border-gray-100"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 block">Min Order (MOQ)</label>
                      <span className="px-2 py-0.5 rounded-full bg-taja-primary/10 text-[8px] font-black text-taja-primary uppercase">Wholesale friendly</span>
                    </div>
                    <Input
                      name="inventory.moq"
                      type="number"
                      value={formData.inventory.moq}
                      onChange={handleChange}
                      className="rounded-xl h-14 font-black border-gray-100"
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <div className={cn(
                      "h-4 w-4 rounded-full",
                      Number(formData.inventory.quantity) > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                    )}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-taja-secondary">
                      {Number(formData.inventory.quantity) > 0 ? "Actively Selling" : "Halted Listings"}
                    </span>
                  </div>
                </div>
              </section>

              {/* Logistics Section */}
              <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium bg-[#1A1A1A] text-white">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-white/10 rounded-2xl">
                    <Truck className="w-5 h-5 text-taja-primary" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight">Performance</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 block">Processing Time</label>
                    <select
                      name="shipping.processingTime"
                      value={formData.shipping.processingTime}
                      onChange={handleChange}
                      className="w-full h-14 px-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-taja-primary focus:border-taja-primary transition-all font-bold text-white appearance-none"
                    >
                      <option value="1-2-days">1-2 Business Days</option>
                      <option value="3-5-days">3-5 Business Days</option>
                      <option value="1-week">1 Week (Pre-order)</option>
                    </select>
                  </div>

                  <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Free Shipping</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          shipping: { ...prev.shipping, freeShipping: !prev.shipping.freeShipping }
                        }))}
                        className={cn(
                          "relative h-5 w-10 rounded-full transition-colors",
                          formData.shipping.freeShipping ? "bg-taja-primary" : "bg-white/10"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 left-1 h-3 w-3 rounded-full bg-white transition-transform",
                          formData.shipping.freeShipping ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {!formData.shipping.freeShipping && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 block">Delivery Fee (₦)</label>
                          <Input
                            name="shipping.shippingCost"
                            type="number"
                            value={formData.shipping.shippingCost}
                            onChange={handleChange}
                            className="rounded-xl h-12 bg-white/5 border-white/10 text-white font-black"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>

              {/* Visibility Panel */}
              <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Market Visibility</h3>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, status: 'active' }))}
                    className={cn(
                      "w-full h-14 rounded-2xl flex items-center gap-4 px-6 border-2 transition-all",
                      formData.status === 'active' ? "border-taja-primary bg-taja-primary/5" : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className={cn("h-3 w-3 rounded-full", formData.status === 'active' ? "bg-taja-primary ring-4 ring-taja-primary/20" : "bg-gray-200")}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-taja-secondary">Active Listing</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-300" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, status: 'draft' }))}
                    className={cn(
                      "w-full h-14 rounded-2xl flex items-center gap-4 px-6 border-2 transition-all",
                      formData.status === 'draft' ? "border-amber-500 bg-amber-50" : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className={cn("h-3 w-3 rounded-full", formData.status === 'draft' ? "bg-amber-500 ring-4 ring-amber-500/20" : "bg-gray-200")}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-taja-secondary">Stored Draft</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-300" />
                  </button>
                </div>
              </section>
            </div>
          </div>
        </Container>
      </main>

      {/* Sticky Bottom Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] border-gray-200"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
          >
            {loading ? "..." : "Hold Draft"}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={(e) => handleSubmit(e, false)}
            className="flex-[2] rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] shadow-premium bg-gradient-to-r from-taja-primary to-emerald-700"
          >
            {loading ? "Refining..." : "Publish Edits"}
          </Button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
