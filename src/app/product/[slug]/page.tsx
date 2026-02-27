"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ShoppingCart,
  Star,
  Shield,
  Truck,
  ChevronLeft,
  Share2,
  MapPin,
  CheckCircle,
  ShieldCheck,
  Minus,
  Plus,
  Phone,
  Instagram,
  Sparkles,
  Zap,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ImageSlider } from "@/components/ui/ImageSlider";
import { useCartStore } from "@/stores/cartStore";
import { cartApi, productsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { StructuredData } from "@/components/StructuredData";
import { generateProductStructuredData, generateBreadcrumbs } from "@/lib/seo";
import { Container } from "@/components/layout";
import { cn } from "@/lib/utils";

// Mock product data - replace with API call
const mockProduct = {
  id: "1",
  slug: "vintage-denim-jacket",
  title: "Vintage Denim Jacket",
  description:
    "A stunning vintage denim jacket in excellent condition. Perfect for casual wear and fashion-forward looks. Made from high-quality denim that has been carefully maintained. This piece features a classic fit and timeless style that never goes out of fashion.",
  longDescription: `This beautiful vintage denim jacket is a must-have for any fashion enthusiast. Crafted from premium denim fabric, it offers both comfort and style.

Features:
• Classic fit with adjustable cuffs
• Multiple pockets for functionality
• Durable construction
• Vintage wash finish
• Authentic vintage styling

This jacket has been carefully maintained and is in excellent condition. It's perfect for layering in colder months or as a statement piece in warmer weather. The timeless design makes it versatile for various occasions.`,
  price: 15000,
  compareAtPrice: 25000,
  stock: 5,
  images: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800",
    "https://images.unsplash.com/photo-1525450824786-227cbef70703?w=800",
    "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800",
  ],
  condition: "like-new",
  category: "Clothing",
  location: "Lagos",
  createdAt: new Date(),
  views: 1245,
  shop: {
    shopName: "Amina Thrift",
    shopSlug: "amina-thrift",
    isVerified: true,
    averageRating: 4.8,
    totalProducts: 45,
    followers: 1234,
    since: "2023",
    socialLinks: {
      instagram: "aminathrift_ng",
      whatsapp: "2348123456789",
    },
  },
  reviews: [
    {
      id: "1",
      userName: "Sarah M.",
      rating: 5,
      comment: "Love this jacket! Perfect fit and condition is amazing.",
      date: "2024-01-15",
      images: [],
    },
    {
      id: "2",
      userName: "Michael T.",
      rating: 4,
      comment: "Great quality for the price. Fast shipping too!",
      date: "2024-01-10",
      images: [],
    },
  ],
  relatedProducts: [
    {
      id: "2",
      slug: "handmade-ankara-bag",
      title: "Handmade Ankara Bag",
      price: 8000,
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
      ],
    },
    {
      id: "3",
      slug: "designer-sneakers",
      title: "Designer Sneakers",
      price: 45000,
      images: [
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
      ],
    },
  ],
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(mockProduct);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addItem, updateQuantity } = useCartStore();

  // Format WhatsApp URL with optional product context message
  const getWhatsAppUrl = (whatsapp: string, product?: any) => {
    if (!whatsapp) return null;
    const cleanNumber = whatsapp.replace(/[\s\+\-]/g, "");
    if (whatsapp.startsWith("http")) return whatsapp;

    let message = "";
    if (product) {
      message = `Hi! I'm interested in "${product.title
        }" (₦${product.price.toLocaleString()}). Can you tell me more about this product?`;
    }

    const baseUrl = `https://wa.me/${cleanNumber}`;
    if (message) {
      const encodedMessage = encodeURIComponent(message);
      return `${baseUrl}?text=${encodedMessage}`;
    }
    return baseUrl;
  };

  // Format Instagram URL
  const getInstagramUrl = (instagram: string) => {
    if (!instagram) return null;
    const username = instagram.replace(/^@/, "");
    if (instagram.startsWith("http")) return instagram;
    return `https://instagram.com/${username}`;
  };

  // Fetch product data based on slug
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productsApi.getBySlug(params.slug as string);

        // Handle different response structures
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

        // Transform API response to match our product structure
        const transformedProduct = {
          id: productData._id || productData.id,
          slug: productData.slug || params.slug,
          sellerId: productData.seller?._id || productData.seller?.id,
          title: productData.name || productData.title || "Product",
          description: productData.description || "",
          longDescription: productData.longDescription || productData.description || "",
          price: productData.price || 0,
          compareAtPrice: productData.compareAtPrice || productData.originalPrice,
          stock: productData.stock || productData.inventory?.quantity || 0,
          images: productData.images || [],
          condition: productData.condition || "good",
          category: productData.category || "",
          specifications: productData.specifications || {},
          location: productData.location || "",
          createdAt: productData.createdAt || new Date().toISOString(),
          views: productData.views || 0,
          shop: {
            shopName: productData.shop?.shopName || productData.shop?.name || "Shop",
            shopSlug: productData.shop?.shopSlug || productData.shop?.slug || productData.shopSlug || "",
            shopId: productData.shop?._id || productData.shop?.id,
            averageRating: productData.shop?.averageRating || 0,
            verified: productData.shop?.verified || false,
            isVerified: productData.shop?.verified || productData.shop?.isVerified || false,
            totalProducts: productData.shop?.totalProducts || 0,
            followers: productData.shop?.followers || productData.shop?.followerCount || 0,
            since: productData.shop?.since || productData.shop?.createdAt || new Date().toISOString(),
            socialLinks: productData.shop?.socialLinks || {
              instagram: "",
              whatsapp: "",
            },
          },
          reviews: productData.reviews || [],
          relatedProducts: productData.relatedProducts || [],
        };

        setProduct(transformedProduct);
      } catch (error: any) {
        console.error("Error fetching product:", error);
        toast.error(error?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      fetchProduct();
    }
  }, [params.slug]);

  const handleAddToCart = async () => {
    try {
      // Add to local cart store
      addItem({
        _id: product.id,
        title: product.title,
        price: product.price,
        images: product.images,
        seller: product.shop.shopName,
        shopSlug: product.shop.shopSlug,
      });

      // Update quantity if needed
      if (quantity > 1) {
        updateQuantity(product.id, quantity);
      }

      // Sync with server if authenticated
      try {
        await cartApi.addToCart(product.id, quantity);
      } catch (apiError) {
        // If API call fails, item is still in local cart
        console.error("Failed to sync cart with server:", apiError);
      }

      toast.success("Added to cart!");
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error(error?.message || "Failed to add to cart");
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };


  const discountPercentage = product.compareAtPrice
    ? Math.round(
      ((product.compareAtPrice - product.price) / product.compareAtPrice) *
      100
    )
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-taja-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  // Generate structured data
  const productStructuredData = generateProductStructuredData({
    name: product.title,
    description: product.description,
    image: product.images,
    price: product.price,
    currency: "NGN",
    availability: product.stock > 0 ? "in stock" : "out of stock",
    condition: product.condition,
    url: `/product/${product.slug}`,
    rating: product.shop.averageRating
      ? {
        value: product.shop.averageRating,
        count: product.reviews.length,
      }
      : undefined,
  });

  const breadcrumbs = generateBreadcrumbs([
    { name: "Home", url: "/" },
    { name: "Marketplace", url: "/marketplace" },
    { name: product.category || "Products", url: "/marketplace" },
    { name: product.title, url: `/product/${product.slug}` },
  ]);

  return (
    <>
      <StructuredData data={productStructuredData} />
      <StructuredData data={breadcrumbs} />
      <div className="min-h-screen bg-motif-blanc text-taja-secondary selection:bg-taja-primary/30 selection:text-taja-secondary">
        {/* Cinematic Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-taja-primary/5 blur-[140px] rounded-full" />
          <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        </div>

        {/* Dynamic Navigation Bar - Premium Glass */}
        <nav className="sticky top-0 z-60 border-b border-slate-100 bg-white/70 backdrop-blur-xl px-4 sm:px-10 h-16 sm:h-20 transition-all duration-500">
          <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-900"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-all shadow-sm">
                <ChevronLeft className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-3">
              <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                <Share2 className="h-4 w-4 sm:h-5 sm:h-5" />
              </button>
              <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                <Heart className="h-4 w-4 sm:h-5 sm:h-5" />
              </button>
            </div>
          </div>
        </nav>

        {/* Main Product Showcase */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-10 pt-10 pb-24 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16">

            {/* Left Column: Visuals */}
            <div className="lg:col-span-7 space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group relative aspect-square sm:aspect-[4/5] bg-slate-50 rounded-none sm:rounded-[2.5rem] overflow-hidden sm:shadow-lg"
              >
                <div className="relative w-full h-full">
                  <Image
                    src={product.images[selectedImageIndex]}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />

                  {/* Badges on Gallery */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {discountPercentage > 0 && (
                      <div className="bg-emerald-500 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 ring-1 ring-white/20">
                        <Zap className="h-3 w-3 text-white fill-white" />
                        <span className="text-[9px] font-black tracking-widest text-white uppercase">{discountPercentage}% OFF</span>
                      </div>
                    )}
                    <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[9px] font-black tracking-widest text-white uppercase">
                      {product.condition}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Thumbnails Mosaic */}
              {product.images.length > 1 && (
                <div className="flex gap-3 px-4 sm:px-0 overflow-x-auto no-scrollbar">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={cn(
                        "relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all",
                        selectedImageIndex === index
                          ? "border-emerald-500 scale-105 shadow-md"
                          : "border-transparent opacity-60"
                      )}
                    >
                      <Image
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Interaction & Data */}
            <div className="lg:col-span-5 flex flex-col h-full lg:sticky lg:top-24">
              <div className="space-y-10">
                {/* Product Metadata */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {product.shop.shopSlug ? (
                      <Link href={`/shop/${product.shop.shopSlug}`} className="group flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                          {product.shop.shopName.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-widest">{product.shop.shopName}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                          {product.shop.shopName.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">{product.shop.shopName}</span>
                      </div>
                    )}
                    {product.shop.isVerified && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    {product.title}
                  </h1>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-bold text-slate-900">{product.shop.averageRating}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">{product.location}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock Panel */}
                <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl overflow-hidden relative">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest uppercase">Price</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-black text-slate-900 tracking-tight">
                        ₦{product.price.toLocaleString()}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-xl text-slate-300 line-through">
                          ₦{product.compareAtPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {product.stock > 0 && (
                    <div className="mt-8 flex items-center gap-4">
                      <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                          disabled={quantity >= product.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{product.stock} in stock</span>
                        <span className="text-[9px] text-slate-400 font-medium">Ready for immediate delivery</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  {product.stock > 0 ? (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={handleBuyNow}
                        className="flex-1 h-16 sm:h-20 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-2xl hover:bg-emerald-600 transition-all duration-500"
                      >
                        Buy Now
                      </Button>
                      <Button
                        onClick={handleAddToCart}
                        variant="outline"
                        className="flex-1 h-16 sm:h-20 rounded-2xl border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                        Add to Cart
                      </Button>
                    </div>
                  ) : (
                    <div className="h-16 sm:h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black uppercase tracking-widest">
                      Out of Stock
                    </div>
                  )}

                  {product.sellerId && (
                    <Link href={`/chat?seller=${product.sellerId}&product=${product.id}`}>
                      <Button
                        variant="outline"
                        className="w-full h-16 rounded-2xl border-2 border-taja-primary text-taja-primary font-black uppercase tracking-widest hover:bg-taja-primary/10 gap-2"
                      >
                        <MessageCircle className="h-5 w-5" />
                        Message seller
                      </Button>
                    </Link>
                  )}
                  {product.shop.socialLinks?.whatsapp && (
                    <a
                      href={getWhatsAppUrl(product.shop.socialLinks.whatsapp, product) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full h-16 rounded-2xl bg-[#25D366] text-white font-black uppercase tracking-widest hover:bg-[#128C7E] transition-all shadow-lg"
                    >
                      <Phone className="h-5 w-5" />
                      WhatsApp
                    </a>
                  )}

                </div>

                {/* Ecosystem Verification */}
                <div className="grid grid-cols-2 gap-5 pt-4">
                  <div className="p-5 rounded-[2.5rem] bg-white border border-black/5 flex items-center gap-4 transition-all hover:border-taja-primary/20 hover:shadow-premium">
                    <div className="w-12 h-12 rounded-2xl bg-taja-primary/10 flex items-center justify-center shrink-0">
                      <Shield className="h-6 w-6 text-taja-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-taja-secondary uppercase tracking-tight">Escrow System</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Global Protection</span>
                    </div>
                  </div>
                  <div className="p-5 rounded-[2.5rem] bg-white border border-black/5 flex items-center gap-4 transition-all hover:border-emerald-500/20 hover:shadow-premium">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Truck className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-taja-secondary uppercase tracking-tight">Secure Logistics</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Priority Transit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Specifications & Reviews */}
          <div className="mt-32 grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 space-y-20">
              {/* Description Section */}
              <section className="space-y-10">
                <div className="flex items-center gap-6">
                  <h2 className="text-3xl font-black text-taja-secondary uppercase tracking-[0.2em] italic">The Narrative</h2>
                  <div className="flex-1 h-px bg-taja-primary/10" />
                </div>
                <div className="prose prose-xl max-w-none">
                  <p className="text-gray-500 leading-relaxed font-medium text-lg leading-[1.8]">
                    {product.longDescription}
                  </p>
                </div>
              </section>

              {/* Reviews Section */}
              <section className="space-y-12">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-taja-secondary uppercase tracking-[0.2em] italic">Verified Vouches</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{product.reviews.length} authenticated transcripts</p>
                  </div>
                  <div className="px-6 py-4 bg-white rounded-[2rem] border border-black/5 text-xs font-black shadow-premium flex items-center gap-3">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    <span className="text-xl tracking-tighter italic">{product.shop.averageRating} <span className="text-gray-200 ml-1">/ 5.0</span></span>
                  </div>
                </div>

                <div className="grid gap-8">
                  {product.reviews.map((review, idx) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      className="p-10 rounded-[3rem] bg-white border border-black/5 shadow-premium group/review transition-all hover:bg-gray-50/50"
                    >
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-taja-primary/5 to-transparent flex items-center justify-center text-2xl font-black text-taja-primary border border-black/5 ring-1 ring-white/60">
                            {review.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-taja-secondary uppercase text-sm tracking-[0.1em]">{review.userName}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-emerald-500" /> Authorized Buyer
                            </p>
                            <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-1 tracking-[0.1em]">{review.date}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? "fill-amber-500 text-amber-500" : "text-gray-100"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed font-medium text-lg italic pl-1 border-l-4 border-taja-primary/10">"{review.comment}"</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar: Merchant Overview */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-8">
                <div className="p-10 rounded-[3rem] bg-taja-secondary text-white shadow-[0_48px_96px_-32px_rgba(15,23,42,0.3)] relative overflow-hidden group/merchant selection:bg-taja-primary/40">
                  {/* Cinematic Elements */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-taja-primary/10 blur-[80px] rounded-full -mr-24 -mt-24 group-hover/merchant:bg-taja-primary/20 transition-colors duration-1000" />

                  <div className="relative space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-[2rem] bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-4xl font-black italic relative shadow-inner">
                        {product.shop.shopName.charAt(0)}
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-huge ring-4 ring-taja-secondary">
                          <ShieldCheck className="h-5 w-5 text-emerald-500 fill-emerald-500" />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-emerald-300 uppercase tracking-[0.3em]">Authorized Store</span>
                        <h3 className="text-3xl font-black tracking-tighter italic leading-tight mt-1 text-white">{product.shop.shopName}</h3>
                        <p className="text-[9px] font-black text-emerald-200/90 uppercase tracking-widest mt-2">
                          Active Since {product.shop.since ? new Date(product.shop.since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-md">
                        <p className="text-[8px] font-black text-emerald-200/80 uppercase tracking-widest mb-2">Store Collection</p>
                        <p className="text-2xl font-black tracking-tighter italic text-white">{product.shop.totalProducts}</p>
                        <span className="text-[8px] font-bold text-emerald-200/70 uppercase tracking-widest">Total Items</span>
                      </div>
                      <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-md">
                        <p className="text-[8px] font-black text-emerald-200/80 uppercase tracking-widest mb-2">Community</p>
                        <p className="text-2xl font-black tracking-tighter italic text-white">{product.shop.followers}</p>
                        <span className="text-[8px] font-bold text-emerald-200/70 uppercase tracking-widest">Followers</span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      {product.shop.shopSlug ? (
                        <Button
                          className="w-full h-16 rounded-[2rem] bg-white text-taja-secondary hover:bg-taja-primary hover:text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-premium transition-all duration-500 italic"
                          onClick={() => router.push(`/shop/${product.shop.shopSlug}`)}
                        >
                          Enter Merchant Showroom
                        </Button>
                      ) : (
                        <Button
                          className="w-full h-16 rounded-[2rem] bg-white/50 text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] cursor-not-allowed italic"
                          disabled
                          title="Shop page link unavailable"
                        >
                          Enter Merchant Showroom (unavailable)
                        </Button>
                      )}

                      {product.shop.socialLinks?.instagram && (
                        <a
                          href={getInstagramUrl(product.shop.socialLinks.instagram) || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-4 w-full h-16 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all"
                        >
                          <Instagram className="h-5 w-5" />
                          Merchant Intel (IG)
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Taja Protocol Guarantee */}
                <div className="p-10 rounded-[3rem] bg-white border border-black/5 shadow-premium space-y-6 relative overflow-hidden group/guarantee">
                  <div className="absolute top-0 left-0 w-1 h-full bg-taja-primary opacity-40" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-taja-primary/10 rounded-2xl">
                      <Shield className="h-6 w-6 text-taja-primary" />
                    </div>
                    <h4 className="text-xs font-black text-taja-secondary uppercase tracking-widest italic">Taja Purchase Protection</h4>
                  </div>
                  <p className="text-[11px] font-medium text-gray-400 leading-relaxed relative z-10 italic">
                    Your transactions are protected by our secure Escrow system. Funds are safely held in our vault until you confirm the successful delivery of your items.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
