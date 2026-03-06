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
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { api, sellerApi, uploadProductImage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { Container } from "@/components/layout";

export default function AdminEditProductPage() {
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
        status: "active" as "active" | "draft" | "suspended",
    });

    const [productOwner, setProductOwner] = useState<any>(null);

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

                // Fetch Product (Using admin-specific fetch if available, or general api)
                const response = await api(`/api/products/${productId}`);

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

                if (productData.shop) {
                    setProductOwner(productData.shop);
                } else if (productData.seller) {
                    setProductOwner(productData.seller);
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
                });
            } catch (error: any) {
                console.error("Failed to fetch data:", error);
                toast.error(error?.message || "Failed to load product information");
            } finally {
                setFetching(false);
            }
        };

        fetchInitialData();
    }, [productId]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.category || !formData.price || formData.images.length === 0) {
            toast.error("Please fill in title, category, price and at least one image");
            return;
        }

        setLoading(true);

        try {
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
                status: formData.status,
            };

            const response = await api(`/api/products/${productId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });

            if (response?.success) {
                toast.success(`Product updated successfully!`);
                router.push("/admin/products");
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="h-12 w-12 border-4 border-slate-900 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fetching Audit Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            <AppHeader />

            <main className="relative z-10 pt-8">
                <Container size="lg">
                    {/* Admin Header */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 mb-12 shadow-huge relative overflow-hidden text-white border border-slate-800">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <Link href="/admin/products" className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/20 rounded-full">
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400">Administrative Override</span>
                                </div>
                                <div className="px-3 py-1 bg-rose-500/20 border border-rose-500/20 rounded-full">
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-rose-400">Concierge Mode</span>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none mb-4">
                                        Audit: {formData.title || "Unknown Product"}
                                    </h1>
                                    <p className="text-slate-400 font-bold text-sm max-w-2xl">
                                        You are editing this product on behalf of <span className="text-emerald-400">{productOwner?.shopName || productOwner?.fullName || "a Seller"}</span>.
                                        Your changes will reflect instantly across the marketplace.
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-[10px] shadow-premium bg-emerald-500 hover:bg-emerald-600 text-white transition-all transform hover:scale-[1.02]"
                                    >
                                        {loading ? "Syncing..." : "Publish Corrections"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Left Column */}
                        <div className="lg:col-span-8 space-y-10">
                            {/* Media Section */}
                            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-10">
                                    <div className="p-3 bg-slate-900 rounded-2xl">
                                        <Camera className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Visual Audit</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gallery & Assets</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                    {formData.images.map((image, index) => (
                                        <motion.div
                                            layout
                                            key={index}
                                            className={cn(
                                                "group relative aspect-square rounded-3xl overflow-hidden border-2 transition-all duration-500",
                                                index === 0 ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-slate-50"
                                            )}
                                        >
                                            <Image src={image} alt={`Preview ${index}`} fill className="object-cover" />

                                            {index === 0 && (
                                                <div className="absolute top-3 left-3 px-2 py-1 bg-emerald-500 rounded-full flex items-center gap-1 shadow-lg">
                                                    <Star className="w-2.5 h-2.5 text-white fill-white" />
                                                    <span className="text-[8px] font-black text-white uppercase tracking-tighter">HERO</span>
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                {index !== 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setMainImage(index)}
                                                        className="p-2 bg-white rounded-xl text-slate-900 hover:text-emerald-500 transition-colors"
                                                    >
                                                        <Star className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="p-2 bg-rose-500 rounded-xl text-white hover:bg-rose-600 transition-colors"
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
                                            className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-emerald-200 transition-colors group"
                                        >
                                            {uploadingImages ? (
                                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
                                            ) : (
                                                <>
                                                    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors">
                                                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3">Add Assets</span>
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
                            </section>

                            {/* Content Section */}
                            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-10">
                                    <div className="p-3 bg-slate-900 rounded-2xl">
                                        <LayoutGrid className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Listing Content</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metadata & Copy</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Product Title</label>
                                        <Input
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="Enter a descriptive title..."
                                            className="rounded-2xl h-16 text-xl font-black border-slate-100 focus:border-emerald-500 bg-slate-50/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Detailed Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={8}
                                            className="w-full px-6 py-5 bg-slate-50/50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-slate-700 text-base"
                                            placeholder="Refine the product description for maximum conversion..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Catalogue Category</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                className="w-full h-16 px-6 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 font-black text-slate-900 appearance-none"
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map((cat) => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Item Condition</label>
                                            <div className="flex gap-2">
                                                {["new", "like-new", "good", "fair"].map((cond) => (
                                                    <button
                                                        key={cond}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, condition: cond as any }))}
                                                        className={cn(
                                                            "flex-1 h-12 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                                            formData.condition === cond
                                                                ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
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

                            {/* Pricing Section */}
                            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-slate-900 rounded-2xl">
                                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Market Valuation</h2>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pricing Strategy</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Variable Range</span>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, isRange: !prev.isRange }))}
                                            className={cn(
                                                "relative h-6 w-12 rounded-full transition-colors",
                                                formData.isRange ? "bg-emerald-500" : "bg-slate-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform",
                                                formData.isRange ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="relative">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">
                                                {formData.isRange ? "Minimum (₦)" : "Standard Price (₦)"}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">₦</span>
                                                <Input
                                                    name="price"
                                                    type="number"
                                                    value={formData.price}
                                                    onChange={handleChange}
                                                    className="rounded-2xl h-16 pl-12 text-2xl font-black border-slate-100 bg-slate-50/50"
                                                />
                                            </div>
                                        </div>

                                        {formData.isRange && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Maximum Cap (₦)</label>
                                                <div className="relative">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">₦</span>
                                                    <Input
                                                        name="maxPrice"
                                                        type="number"
                                                        value={formData.maxPrice}
                                                        onChange={handleChange}
                                                        className="rounded-2xl h-16 pl-12 text-2xl font-black border-slate-100 bg-slate-50/50 text-emerald-600"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">MSRP / Compare At (₦)</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-300">NGN</span>
                                            <Input
                                                name="compareAtPrice"
                                                type="number"
                                                value={formData.compareAtPrice}
                                                onChange={handleChange}
                                                className="rounded-2xl h-16 pl-16 text-lg font-bold text-slate-400 border-slate-100 bg-slate-50/50 line-through"
                                            />
                                        </div>
                                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                                            <ShieldAlert className="w-5 h-5 text-emerald-500 shrink-0" />
                                            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest leading-relaxed">
                                                Increasing the comparison price often increases perceived value during a concierge-led onboarding process.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-4 space-y-10">
                            {/* Inventory Management */}
                            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2.5 bg-slate-900 rounded-2xl">
                                        <Package className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Stock Audit</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Units Available</label>
                                        <Input
                                            name="inventory.quantity"
                                            type="number"
                                            value={formData.inventory.quantity}
                                            onChange={handleChange}
                                            className="rounded-xl h-14 font-black border-slate-100 bg-slate-50/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Minimum Order Qty</label>
                                        <Input
                                            name="inventory.moq"
                                            type="number"
                                            value={formData.inventory.moq}
                                            onChange={handleChange}
                                            className="rounded-xl h-14 font-black border-slate-100 bg-slate-50/50"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Market Status */}
                            <section className="bg-slate-900 rounded-[2.5rem] p-8 shadow-huge text-white border border-slate-800">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8">Catalogue Visibility</h3>

                                <div className="space-y-4">
                                    {[
                                        { id: 'active', label: 'Market Live', color: 'bg-emerald-500', sub: 'Visible to everyone' },
                                        { id: 'draft', label: 'Store Draft', color: 'bg-amber-500', sub: 'Saved but hidden' },
                                        { id: 'suspended', label: 'Admin Locked', color: 'bg-rose-500', sub: 'Requires review' }
                                    ].map((stat) => (
                                        <button
                                            key={stat.id}
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, status: stat.id as any }))}
                                            className={cn(
                                                "w-full h-18 rounded-2xl flex items-center justify-between px-6 border-2 transition-all",
                                                formData.status === stat.id
                                                    ? "border-emerald-500 bg-emerald-500/5"
                                                    : "border-slate-800 hover:border-slate-700"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn("h-3 w-3 rounded-full", formData.status === stat.id ? stat.color + " ring-4 ring-" + stat.color + "/20" : "bg-slate-700")}></div>
                                                <div className="text-left">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white">{stat.label}</p>
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{stat.sub}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className={cn("w-4 h-4", formData.status === stat.id ? "text-emerald-500" : "text-slate-700")} />
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Owner Info Sidebar */}
                            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Attribution</h3>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 font-black">
                                        {(productOwner?.shopName || productOwner?.fullName || "S")[0]}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 truncate max-w-[150px]">
                                            {productOwner?.shopName || productOwner?.fullName || "Unknown Seller"}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Store Owner</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </Container>
            </main>
        </div>
    );
}
