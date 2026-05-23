"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  Sparkles,
  DollarSign,
    Trash2,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { api, sellerApi, uploadProductImage, uploadProductVideo } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout";
import { CategoryPickerModal, categoryPickerLabel, ProductDescriptionEditor, ProductAiFillModal } from "@/components/product";
import {
  isRichTextDescriptionEmpty,
  looksLikeHtmlDescription,
  plainTextToRichHtml,
  sanitizeProductDescriptionHtml,
} from "@/lib/sanitizeProductDescriptionHtml";
import { mergeSellerProductFormWithAiAnalysis } from "@/lib/productAiFillFromAnalysis";
import type { ProductImageAiAnalysis } from "@/lib/ai/imageRecognition";

const SELLER_SIDEBAR_COLLAPSED_KEY = "taja_seller_sidebar_collapsed";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [sellerSidebarUndocked, setSellerSidebarUndocked] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    condition: "new" as "new" | "like-new" | "good" | "fair" | "poor",
    price: "",
    compareAtPrice: "",
    currency: "NGN",
    images: [] as string[],
    videos: [] as { url: string; type: "video"; thumbnail?: string; duration?: number }[],
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
      costPerKg: "",
      shippingPayer: "buyer" as "buyer" | "seller" | "platform" | "split",
      lagosMainlandDelivery: "",
      lagosIslandDelivery: "",
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
    isNegotiable: false,
    status: "active" as "active" | "draft",
    shipsFromSameAsShop: true,
    shipsFromCity: "",
    shipsFromState: "",
  });

  const [tagInput, setTagInput] = useState("");
  const [shopAddressHint, setShopAddressHint] = useState({ city: "", state: "" });

  const selectedCategoryLabel = useMemo(() => {
    if (!formData.category) return "Select category";
    const c = categories.find((x) => String(x._id) === String(formData.category));
    return c ? categoryPickerLabel(c) : "Select category";
  }, [formData.category, categories]);
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [aiFillModalOpen, setAiFillModalOpen] = useState(false);

  // Fetch categories and product data
  useEffect(() => {
    const syncSidebarMode = () => {
      try {
        const collapsed = localStorage.getItem(SELLER_SIDEBAR_COLLAPSED_KEY) === "1";
        setSellerSidebarUndocked(!collapsed);
      } catch {
        setSellerSidebarUndocked(false);
      }
    };

    const onSidebarModeChange = (event: Event) => {
      const collapsed = (event as CustomEvent<{ collapsed?: boolean }>).detail?.collapsed;
      if (typeof collapsed === "boolean") {
        setSellerSidebarUndocked(!collapsed);
        return;
      }
      syncSidebarMode();
    };

    syncSidebarMode();
    window.addEventListener("storage", syncSidebarMode);
    window.addEventListener("taja:seller-sidebar-collapsed-change", onSidebarModeChange);
    return () => {
      window.removeEventListener("storage", syncSidebarMode);
      window.removeEventListener("taja:seller-sidebar-collapsed-change", onSidebarModeChange);
    };
  }, []);

  // Fetch categories and product data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setFetching(true);

        // Fetch Categories
        const categoriesRes = await api("/api/seller/categories");
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
        const rawDescription = productData.description || "";
        setFormData({
          title: productData.name || productData.title || "",
          description: looksLikeHtmlDescription(rawDescription)
            ? rawDescription
            : plainTextToRichHtml(rawDescription),
          category: typeof productData.category === 'object' ? productData.category._id : productData.category || "",
          subcategory: productData.subcategory || "",
          condition: productData.condition || "new",
          price: String(productData.price || ""),
          compareAtPrice: productData.compareAtPrice || productData.originalPrice ? String(productData.compareAtPrice || productData.originalPrice) : "",
          currency: productData.currency || "NGN",
          images: productData.images || [],
          videos: (productData.videos || []).map((v: any) =>
            typeof v === "string" ? { url: v, type: "video" as const } : { ...v, type: "video" as const }
          ),
          isNegotiable: !!productData.isNegotiable,
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
            costPerKg: productData.shipping?.costPerKg ? String(productData.shipping.costPerKg) : "",
            shippingPayer: productData.shipping?.shippingPayer || "buyer",
            lagosMainlandDelivery:
              productData.shipping?.lagosMainlandDelivery != null
                ? String(productData.shipping.lagosMainlandDelivery)
                : "",
            lagosIslandDelivery:
              productData.shipping?.lagosIslandDelivery != null
                ? String(productData.shipping.lagosIslandDelivery)
                : "",
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
          shipsFromSameAsShop: !(
            productData.listingLocation?.city ||
            productData.listingLocation?.state
          ),
          shipsFromCity: productData.listingLocation?.city || "",
          shipsFromState: productData.listingLocation?.state || "",
        });
        const sh = typeof productData.shop === "object" && productData.shop ? (productData.shop as any) : null;
        if (sh?.address?.city || sh?.address?.state) {
          setShopAddressHint({
            city: String(sh.address.city || ""),
            state: String(sh.address.state || ""),
          });
        } else {
          setShopAddressHint({ city: "", state: "" });
        }
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

  const handleAiFillApplied = (payload: {
    analysis: ProductImageAiAnalysis;
    imageUrl: string;
    overwrite: boolean;
    prependImage: boolean;
  }) => {
    setFormData((prev) =>
      mergeSellerProductFormWithAiAnalysis(prev, payload.analysis, {
        categories,
        imageUrl: payload.imageUrl,
        prependImage: payload.prependImage,
        overwrite: payload.overwrite,
      })
    );
    const hint =
      payload.analysis.suggestedPriceRange ||
      (payload.analysis.suggestedPriceNgn
        ? `≈ ₦${payload.analysis.suggestedPriceNgn.toLocaleString()}`
        : "");
    if (hint) setSuggestedPrice(hint);
    toast.success("AI filled the listing — review title, category, and price before saving.");
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleVideoUpload = async (files: FileList) => {
    if (files.length === 0) return;
    setUploadingVideos(true);
    try {
      const availableSlots = Math.max(0, 2 - formData.videos.length);
      if (availableSlots <= 0) {
        toast.error("You can add up to 2 videos");
        return;
      }
      const selected = Array.from(files).slice(0, availableSlots);
      const oversized = selected.find((f) => f.size > 20 * 1024 * 1024);
      if (oversized) {
        toast.error("Each video must be 20MB or less");
        return;
      }
      const uploadedUrls = await Promise.all(selected.map((file) => uploadProductVideo(file)));
      setFormData((prev) => ({
        ...prev,
        videos: [
          ...prev.videos,
          ...uploadedUrls.map((url) => ({ url, type: "video" as const })),
        ].slice(0, 2),
      }));
      toast.success(`${uploadedUrls.length} video(s) uploaded`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload video");
    } finally {
      setUploadingVideos(false);
    }
  };

  const removeVideo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
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
    if (!isDraft && isRichTextDescriptionEmpty(formData.description)) {
      toast.error("Please add a product description");
      return;
    }
    const shippingValidation = validateShippingPolicy({
      ...formData.shipping,
      shippingCost: formData.shipping.shippingCost ? parseFloat(formData.shipping.shippingCost) : 0,
      costPerKg: formData.shipping.costPerKg ? parseFloat(formData.shipping.costPerKg) : 0,
      weight: formData.shipping.weight ? parseFloat(formData.shipping.weight) : 0,
      lagosMainlandDelivery:
        formData.shipping.lagosMainlandDelivery.trim() === ""
          ? undefined
          : parseFloat(formData.shipping.lagosMainlandDelivery),
      lagosIslandDelivery:
        formData.shipping.lagosIslandDelivery.trim() === ""
          ? undefined
          : parseFloat(formData.shipping.lagosIslandDelivery),
    });
    if (!shippingValidation.isValid) {
      toast.error(shippingValidation.message || "Invalid logistics policy");
      return;
    }

    setLoading(true);

    try {
      // Clean data to avoid CastErrors
      const payload = {
        title: formData.title,
        description: sanitizeProductDescriptionHtml(formData.description),
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        condition: formData.condition,
        price: parseFloat(formData.price),
        maxPrice: null,
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        currency: formData.currency,
        images: formData.images,
        videos: formData.videos,
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
          costPerKg: formData.shipping.costPerKg ? parseFloat(formData.shipping.costPerKg) : undefined,
          shippingPayer: formData.shipping.shippingPayer,
          lagosMainlandDelivery:
            formData.shipping.lagosMainlandDelivery.trim() === ""
              ? null
              : (() => {
                  const n = parseFloat(formData.shipping.lagosMainlandDelivery);
                  return Number.isFinite(n) && n >= 0 ? n : null;
                })(),
          lagosIslandDelivery:
            formData.shipping.lagosIslandDelivery.trim() === ""
              ? null
              : (() => {
                  const n = parseFloat(formData.shipping.lagosIslandDelivery);
                  return Number.isFinite(n) && n >= 0 ? n : null;
                })(),
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
        listingLocation: formData.shipsFromSameAsShop
          ? null
          : formData.shipsFromCity.trim() || formData.shipsFromState.trim()
            ? {
                city: formData.shipsFromCity.trim(),
                state: formData.shipsFromState.trim(),
                country: "Nigeria",
              }
            : null,
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
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading product...</p>
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
                <span className="text-[10px] font-black uppercase tracking-widest text-taja-primary">Edit product</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-taja-secondary tracking-tighter leading-none">
                Edit: {formData.title || "Product"}
              </h1>
              <p className="text-gray-400 font-medium text-sm">Update the details and photos below. Your current images are shown so you can see where you left off.</p>
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
                {loading ? "Saving…" : "Save and publish"}
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 gap-10 px-4",
              sellerSidebarUndocked ? "lg:grid-cols-1" : "lg:grid-cols-12"
            )}
          >
            {/* Left Column - Main Details */}
            <div className="lg:col-span-8 space-y-10">
              {/* Media Section */}
              <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-taja-primary/10 rounded-2xl">
                    <Camera className="w-5 h-5 text-taja-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-taja-secondary tracking-tight">Product photos</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add, remove, or reorder. First image is the main one.</p>
                  </div>
                </div>
                {formData.images.length > 0 && (
                  <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-xs font-bold text-gray-600">
                      Your current images — this is what buyers see. Change or add more below.
                    </p>
                  </div>
                )}
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
                          <span className="text-[8px] font-black text-white uppercase tracking-tighter">Cover</span>
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
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-3">Add photo</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-8 border-t border-gray-100 pt-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product videos</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{formData.videos.length} / 2</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formData.videos.map((video, index) => (
                      <div key={`${video.url}-${index}`} className="relative rounded-3xl overflow-hidden border border-gray-100 bg-black">
                        <video src={video.url} controls className="w-full h-48 object-contain" />
                        <button
                          type="button"
                          onClick={() => removeVideo(index)}
                          className="absolute top-3 right-3 p-2 bg-red-500 rounded-xl text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.videos.length < 2 && (
                      <label className="h-48 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-taja-primary hover:text-taja-primary transition-all cursor-pointer">
                        {uploadingVideos ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {uploadingVideos ? "Uploading..." : "Add video (max 20MB)"}
                        </span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="hidden"
                          multiple
                          onChange={(e) => e.target.files && handleVideoUpload(e.target.files)}
                        />
                      </label>
                    )}
                  </div>
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
                    <span className="text-taja-primary mr-1 font-bold">Tip:</span>
                    Listings with several clear photos often sell better. The first image is the one buyers see first.
                  </p>
                </div>
              </section>

              {/* Core Information */}
              <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-2xl">
                    <Package className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-taja-secondary tracking-tight">Title & description</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">What buyers see in the listing</p>
                  </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAiFillModalOpen(true)}
                    className="shrink-0 rounded-2xl text-[10px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                    Fill from photo (AI)
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">Title</label>
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
                    <ProductDescriptionEditor
                      value={formData.description}
                      onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                      placeholder="Describe the product clearly for buyers… Use bold, lists, and headings as needed."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">Category</label>
                      <button
                        type="button"
                        onClick={() => setCategoryModalOpen(true)}
                        className={cn(
                          "w-full h-14 px-5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-taja-primary/20 focus:border-taja-primary transition-all font-bold text-taja-secondary flex items-center justify-between gap-2 text-left",
                          !formData.category && "text-gray-400"
                        )}
                      >
                        <span className="truncate">{selectedCategoryLabel}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                      </button>
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
                      <h2 className="text-xl sm:text-2xl font-black text-taja-secondary tracking-tight">Sizes / options</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">e.g. Red, XL, 1kg</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={addVariant}
                    variant="outline"
                    className="rounded-2xl border-taja-primary/20 text-taja-primary hover:bg-taja-primary hover:text-white transition-all font-black uppercase tracking-widest text-[10px] h-12 px-6 w-full sm:w-auto flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add option
                  </Button>
                </div>

                {formData.variants.length > 0 ? (
                  <div className="space-y-10">
                    {/* Grid layout labels are now inside the cards for more space */}

                    <AnimatePresence>
                      {formData.variants.map((variant, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="relative p-6 sm:p-4 glass-card bg-white border-gray-100 rounded-[2rem] sm:rounded-[1.5rem] shadow-sm hover:shadow-premium transition-all group"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
                             {/* Option Name Input */}
                             <div className="space-y-3">
                               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Option Name</label>
                               <input
                                 type="text"
                                 value={variant.name}
                                 onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                 placeholder="Red / XL"
                                 className="w-full h-16 px-6 bg-gray-50/50 border border-gray-100 focus:border-taja-primary focus:bg-white focus:ring-8 focus:ring-taja-primary/5 transition-all rounded-[20px] text-lg font-bold text-taja-secondary shadow-sm"
                               />
                             </div>

                             {/* Price Input */}
                             <div className="space-y-3">
                               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (₦)</label>
                               <input
                                 type="number"
                                 value={variant.price}
                                 onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                 placeholder="0"
                                 className="w-full h-16 px-6 bg-gray-50/50 border border-gray-100 focus:border-taja-primary focus:bg-white focus:ring-8 focus:ring-taja-primary/5 transition-all rounded-[20px] text-xl font-black text-taja-primary text-center shadow-sm"
                               />
                             </div>

                             {/* Stock Input */}
                             <div className="space-y-3">
                               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock</label>
                               <input
                                 type="number"
                                 value={variant.stock}
                                 onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                                 placeholder="0"
                                 className="w-full h-16 px-6 bg-gray-50/50 border border-gray-100 focus:border-taja-primary focus:bg-white focus:ring-8 focus:ring-taja-primary/5 transition-all rounded-[20px] text-lg font-bold text-taja-secondary text-center shadow-sm"
                               />
                             </div>

                             {/* Weight Input */}
                             <div className="space-y-3">
                               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Weight (kg)</label>
                               <input
                                 type="number"
                                 step="0.01"
                                 value={variant.weight}
                                 onChange={(e) => updateVariant(index, 'weight', e.target.value)}
                                 placeholder="0"
                                 className="w-full h-16 px-6 bg-gray-50/50 border border-gray-100 focus:border-taja-primary focus:bg-white focus:ring-8 focus:ring-taja-primary/5 transition-all rounded-[20px] text-base font-medium text-gray-500 shadow-sm"
                               />
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
                  <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem] sm:rounded-[2.5rem] bg-gray-50/30">
                    <div className="w-16 h-16 rounded-3xl bg-white shadow-premium flex items-center justify-center mb-6">
                      <LayoutGrid className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 text-center px-4">No sizes or options yet</p>
                    <Button
                      type="button"
                      onClick={addVariant}
                      className="rounded-2xl border-gray-200 text-gray-400 hover:border-taja-primary hover:text-taja-primary transition-all font-black uppercase tracking-widest text-[10px] h-10 px-6 bg-white"
                      variant="outline"
                    >
                      Add option
                    </Button>
                  </div>
                )}

                <div className="mt-8 sm:mt-10 p-4 sm:p-6 rounded-3xl bg-blue-50/50 border border-blue-100/50 flex flex-col sm:flex-row items-start gap-4">
                  <div className="p-2 bg-blue-500 rounded-lg shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[10px] font-bold text-blue-900 leading-relaxed uppercase tracking-widest mt-1">
                    Add options like size or color so buyers can pick. Each option can have its own price and stock.
                  </p>
                </div>
              </section>


              {/* Pricing Section */}
              <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-amber-500/10 rounded-2xl">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-taja-secondary tracking-tight">Price</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {formData.variants.length > 0
                        ? "Base listing price — options add their own prices"
                        : "Selling price in ₦"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="relative space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block">
                          {formData.variants.length > 0 ? "Base price (₦)" : "Price (₦)"}
                        </label>
                        {suggestedPrice && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-taja-primary/5 text-[9px] font-bold text-taja-primary uppercase tracking-[0.16em]">
                            <Sparkles className="h-3 w-3" />
                            {suggestedPrice}
                          </div>
                        )}
                      </div>
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
                        <div className="group space-y-4 pt-4">
                          <label className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-taja-primary/30 hover:shadow-premium-hover transition-all cursor-pointer group/negotiable">
                            <div className="relative flex items-center justify-center">
                              <input
                                name="isNegotiable"
                                type="checkbox"
                                checked={formData.isNegotiable}
                                onChange={handleChange}
                                className="h-6 w-6 rounded-lg border-gray-200 text-taja-primary focus:ring-taja-primary/20 transition-all cursor-pointer"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <span className="block text-xs font-black text-taja-secondary uppercase tracking-tight">Price is negotiable</span>
                              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Allow buyers to discuss pricing</span>
                            </div>
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAiFillModalOpen(true)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-taja-primary/10 text-[9px] font-black text-taja-primary uppercase tracking-[0.16em] hover:bg-taja-primary hover:text-white transition-colors"
                        >
                          <Sparkles className="h-3 w-3" />
                          AI fill
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">Compare at / Was (₦)</label>
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
                        A higher "compare at" price can make your current price look like a better deal.
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
                  <h2 className="text-lg font-black text-taja-secondary tracking-tight">Stock</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-2 block">In stock</label>
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
<label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 block">Min order (MOQ)</label>
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
                      {Number(formData.inventory.quantity) > 0 ? "In stock" : "Out of stock"}
                    </span>
                  </div>
                </div>
              </section>

              <motion.section variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }} className="glass-panel p-8 border-white/60 rounded-[40px] relative overflow-hidden bg-gradient-to-br from-white to-sky-50/30 shadow-premium">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-sky-500/10 rounded-2xl">
                    <MapPin className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-sky-600 uppercase tracking-[0.3em]">Ships from</h3>
                    <p className="text-xl font-black text-taja-secondary tracking-tighter italic">Listing location</p>
                  </div>
                </div>
                <p className="text-xs text-taja-secondary/70 mb-6 leading-relaxed">
                  Shown on product cards. Defaults to your shop address unless you specify a different city here.
                </p>
                {(shopAddressHint.city || shopAddressHint.state) && (
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Shop address: {shopAddressHint.city}
                    {shopAddressHint.city && shopAddressHint.state ? ", " : ""}
                    {shopAddressHint.state}
                  </p>
                )}
                <label className="flex items-center gap-3 p-4 rounded-2xl border border-sky-100 bg-white/60 cursor-pointer mb-6">
                  <input
                    type="checkbox"
                    name="shipsFromSameAsShop"
                    checked={formData.shipsFromSameAsShop}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm font-bold text-taja-secondary">Same as shop address</span>
                </label>
                {!formData.shipsFromSameAsShop && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">City</label>
                      <Input name="shipsFromCity" value={formData.shipsFromCity} onChange={handleChange} placeholder="City" className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">State</label>
                      <Input name="shipsFromState" value={formData.shipsFromState} onChange={handleChange} placeholder="State" className="rounded-xl h-12" />
                    </div>
                  </div>
                )}
              </motion.section>

                            {/* Shipping Card */}
              <motion.section variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }} className="glass-panel p-8 border-white/60 rounded-[40px] relative overflow-hidden bg-gradient-to-br from-white to-purple-50/20 shadow-premium">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[80px] rounded-full -z-10" />
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-purple-500/10 rounded-2xl">
                    <Truck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Logistics Protocol</h3>
                    <p className="text-xl font-black text-taja-secondary tracking-tighter italic">Delivery Strategy</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Primary Shipping Toggle */}
                  <div className="p-6 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between group hover:bg-emerald-500/10 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-emerald-100 group-hover:scale-110 transition-transform duration-500">
                        <Sparkles className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-taja-secondary">Free Shipping</p>
                        <p className="text-[10px] text-emerald-600/70 font-medium uppercase tracking-widest mt-0.5">Complimentary Delivery</p>
                      </div>
                    </div>
                    <label className="relative cursor-pointer">
                      <input
                        type="checkbox"
                        name="shipping.freeShipping"
                        checked={formData.shipping.freeShipping}
                        onChange={handleChange}
                        className="peer hidden"
                      />
                      <div className="w-14 h-8 bg-gray-200 peer-checked:bg-emerald-500 rounded-full transition-all duration-300 shadow-inner" />
                      <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-6 shadow-md" />
                    </label>
                  </div>
                  {formData.shipping.freeShipping && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                        Free shipping sponsor *
                      </label>
                      <select
                        name="shipping.shippingPayer"
                        value={formData.shipping.shippingPayer}
                        onChange={handleChange}
                        className="w-full h-12 sm:h-14 px-4 sm:px-5 rounded-2xl border border-emerald-200 bg-white/90 text-sm font-bold text-taja-secondary focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                      >
                        <option value="seller">Seller covers delivery</option>
                        <option value="platform">Platform subsidy</option>
                        <option value="split">Split seller/platform</option>
                        <option value="buyer">Buyer pays (invalid for free shipping)</option>
                      </select>
                    </div>
                  )}

                  {!formData.shipping.freeShipping && (
                    <div className="space-y-4 sm:space-y-6">


                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 group-focus-within:bg-blue-500 animate-pulse" />
                          Cost per kg (₦) — Weight
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                          <input
                            name="shipping.costPerKg"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.shipping.costPerKg}
                            onChange={handleChange}
                            placeholder="0.00"
                            inputMode="decimal"
                            className="w-full h-12 sm:h-16 pl-10 sm:pl-12 pr-4 sm:pr-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-blue-500/40 focus:ring-4 sm:focus:ring-8 focus:ring-blue-500/5 transition-all rounded-2xl text-base sm:text-lg font-black text-taja-secondary shadow-sm"
                          />
                        </div>
                      </motion.div>

                      {/* Lagos Specific Overrides */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-white space-y-5 sm:space-y-6 shadow-sm relative overflow-hidden"
                      >
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl" />
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm border border-purple-100">
                            <MapPin className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-purple-900 uppercase tracking-[0.2em]">Lagos Intelligence</p>
                            <p className="text-sm font-bold text-taja-secondary">Mainland vs Island (Optional)</p>
                          </div>
                        </div>
                        
                        <p className="text-[11px] text-gray-500 leading-relaxed max-w-lg">
                          Set both to override the default Lagos table for this item. Checkout picks <strong>mainland</strong> or <strong>island &amp; premium</strong> from the buyer&apos;s address. Leave blank to use the flat fee above.
                        </p>

                        <div className="space-y-5 sm:space-y-6 pt-1 sm:pt-2">
                          <div className="group space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-purple-600 transition-colors">Mainland (₦ / unit)</label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                              <input
                                name="shipping.lagosMainlandDelivery"
                                type="number"
                                min="0"
                                value={formData.shipping.lagosMainlandDelivery}
                                onChange={handleChange}
                                placeholder="e.g. 2500"
                                inputMode="decimal"
                                className="w-full h-12 sm:h-16 pl-10 sm:pl-12 pr-4 sm:pr-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-purple-500/40 focus:ring-4 sm:focus:ring-8 focus:ring-purple-500/5 transition-all rounded-[20px] text-base sm:text-lg font-black text-taja-secondary shadow-sm"
                              />
                            </div>
                          </div>
                          <div className="group space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-purple-600 transition-colors">Island & premium (₦ / unit)</label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                              <input
                                name="shipping.lagosIslandDelivery"
                                type="number"
                                min="0"
                                value={formData.shipping.lagosIslandDelivery}
                                onChange={handleChange}
                                placeholder="e.g. 4500"
                                inputMode="decimal"
                                className="w-full h-12 sm:h-16 pl-10 sm:pl-12 pr-4 sm:pr-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-purple-500/40 focus:ring-4 sm:focus:ring-8 focus:ring-purple-500/5 transition-all rounded-[20px] text-base sm:text-lg font-black text-taja-secondary shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Estimated Product Weight (kg)</label>
                        <div className="relative">
                          <Package className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            name="shipping.weight"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.shipping.weight}
                            onChange={handleChange}
                            placeholder="0.00"
                            className="w-full h-16 pl-14 pr-6 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-8 focus:ring-taja-primary/5 transition-all rounded-2xl text-lg font-bold text-taja-secondary shadow-sm"
                          />
                        </div>
                      </motion.div>
                    </div>
                  )}

                  <div className="group space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-taja-primary transition-colors">Processing Time Protocol</label>
                    <div className="relative">
                      <Zap className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <select
                        name="shipping.processingTime"
                        value={formData.shipping.processingTime}
                        onChange={handleChange}
                        className="w-full h-16 pl-14 pr-12 glass-card border-white/60 bg-white/40 focus:bg-white focus:border-taja-primary/40 focus:ring-8 focus:ring-taja-primary/5 transition-all appearance-none rounded-2xl text-xs font-black uppercase tracking-widest text-taja-secondary cursor-pointer shadow-sm"
                      >
                        <option value="1-2-days">1-2 Business Days (High Efficiency)</option>
                        <option value="3-5-days">3-5 Business Days (Standard Protocol)</option>
                        <option value="1-week">1 Week Execution</option>
                        <option value="2-weeks">2 Weeks Strategic Fulfillment</option>
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none group-hover:text-taja-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Visibility Panel */}
              <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Visibility</h3>

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
                    <span className="text-[10px] font-black uppercase tracking-widest text-taja-secondary">Live — visible to buyers</span>
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-taja-secondary">Draft — hidden from buyers</span>
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
            {loading ? "..." : "Save draft"}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={(e) => handleSubmit(e, false)}
            className="flex-[2] rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] shadow-premium bg-gradient-to-r from-taja-primary to-emerald-700"
          >
            {loading ? "Saving…" : "Save and publish"}
          </Button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>

      <CategoryPickerModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        selectedId={formData.category}
        onSelect={(id) => setFormData((prev) => ({ ...prev, category: id }))}
        createEndpoint="/api/seller/categories"
        onCategoryCreated={(cat) =>
          setCategories((prev) =>
            prev.some((x) => String(x._id) === String(cat._id)) ? prev : [...prev, cat]
          )
        }
      />

      <ProductAiFillModal
        open={aiFillModalOpen}
        onClose={() => setAiFillModalOpen(false)}
        onApplied={handleAiFillApplied}
      />
    </div>
  );
}
