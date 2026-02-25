"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Store,
  Star,
  CheckCircle,
  Search,
  Grid,
  Plus,
  Loader2,
  Sparkles,
  TrendingUp,
  Users,
  Package,
  MapPin,
  Heart,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { shopsApi, api } from "@/lib/api";
import { toast } from "react-hot-toast";

interface Shop {
  _id: string;
  shopName: string;
  shopSlug: string;
  description?: string;
  logo?: string;
  banner?: string;
  categories?: string[];
  verification?: {
    isVerified: boolean;
  };
  stats?: {
    averageRating: number;
    totalReviews: number;
    totalProducts: number;
  };
  owner?: {
    fullName: string;
    avatar?: string;
    isVerified: boolean;
  };
  settings?: {
    isActive: boolean;
  };
}

export default function ShopsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchShops();
  }, [page, searchQuery]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await shopsApi.getAll({
        page,
        limit: 20,
        search: searchQuery || undefined,
      });

      if (response.success) {
        const newShops = response.data.shops || [];
        if (page === 1) {
          setShops(newShops);
        } else {
          setShops((prev) => [...prev, ...newShops]);
        }
        setHasMore(response.data.pagination.page < response.data.pagination.pages);

        // Generate AI message if no shops exist
        if (newShops.length === 0 && page === 1 && !searchQuery) {
          generateEmptyStateMessage();
        }
      }
    } catch (error: any) {
      console.error("Error fetching shops:", error);
      toast.error("Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  const generateEmptyStateMessage = async () => {
    try {
      setGeneratingMessage(true);
      const prompt = `Generate an inspiring and encouraging message for when there are no shops yet on a Nigerian e-commerce marketplace. The message should be friendly, motivational, and encourage users to be the first to create a shop. Make it warm and welcoming. Keep it under 150 words.`;
      
      const response = await api("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });

      if (response.text) {
        setEmptyStateMessage(response.text);
      }
    } catch (error) {
      console.error("Error generating AI message:", error);
      // Fallback message
      setEmptyStateMessage(
        "No shops yet! Be the first to create your own shop and start selling on Taja.Shop. Join our community of sellers and showcase your unique products to buyers across Nigeria."
      );
    } finally {
      setGeneratingMessage(false);
    }
  };

  const handleCreateShop = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to create a shop");
      router.push("/login?redirect=/shops/new");
      return;
    }
    router.push("/shops/new");
  };

  const ShopCard = ({ shop }: { shop: Shop }) => (
    <Link href={`/shop/${shop.shopSlug}`}>
      <Card className="group hover:shadow-xl transition-all duration-300 card-hover overflow-hidden h-full flex flex-col">
        {/* Banner */}
        <div className="relative h-32 md:h-40 bg-gradient-taja overflow-hidden">
          {shop.banner ? (
            <Image
              src={shop.banner}
              alt={shop.shopName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-400 via-gray-500 to-emerald-600" />
          )}
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Logo */}
          <div className="absolute -bottom-8 left-4 w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
            {shop.logo ? (
              <Image
                src={shop.logo}
                alt={shop.shopName}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                <Store className="h-8 w-8 text-gray-600" />
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-4 pt-10 flex-1 flex flex-col">
          {/* Shop Name & Verification */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-taja-primary transition-colors line-clamp-1">
                {shop.shopName}
              </h3>
            </div>
            {shop.verification?.isVerified && (
              <div className="flex-shrink-0 ml-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
            )}
          </div>

          {/* Description */}
          {shop.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">
              {shop.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-auto pt-3 border-t">
            {shop.stats?.averageRating && shop.stats.averageRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{shop.stats.averageRating.toFixed(1)}</span>
                {shop.stats.totalReviews > 0 && (
                  <span className="text-gray-500">({shop.stats.totalReviews})</span>
                )}
              </div>
            )}
            {shop.stats?.totalProducts !== undefined && (
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>{shop.stats.totalProducts}</span>
              </div>
            )}
          </div>

          {/* Categories */}
          {shop.categories && shop.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {shop.categories.slice(0, 3).map((cat, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4 md:mb-0">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Store className="h-6 w-6 md:h-8 md:w-8 text-taja-primary" />
                Shops
              </h1>
              <p className="text-sm text-gray-600 mt-1 hidden sm:block">
                Discover amazing shops and sellers
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateShop}
                variant="gradient"
                className="hidden sm:flex"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Shop
              </Button>
              <button
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-taja-primary hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search shops..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-50 sm:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-40" : "opacity-0"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Menu Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-72 bg-white shadow-xl p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-semibold text-gray-900">Menu</span>
            <button
              className="p-2 rounded-md text-gray-700 hover:text-taja-primary hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-col space-y-4">
            <Link
              href="/"
              className="text-gray-800 hover:text-taja-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/marketplace"
              className="text-gray-800 hover:text-taja-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marketplace
            </Link>
            <Link
              href="/shops"
              className="text-taja-primary font-semibold py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shops
            </Link>
            <Link
              href="/how-it-works"
              className="text-gray-800 hover:text-taja-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              How it Works
            </Link>
            <div className="pt-4 border-t">
              <Button
                onClick={() => {
                  handleCreateShop();
                  setMobileMenuOpen(false);
                }}
                variant="gradient"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Shop
              </Button>
            </div>
            <div className="pt-4 border-t space-y-2">
              <Link
                href="/login"
                className="block text-gray-800 hover:text-taja-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block bg-taja-primary text-white px-4 py-2 rounded-lg hover:bg-emerald-600 text-center transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && shops.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-taja-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading shops...</p>
            </div>
          </div>
        ) : shops.length === 0 ? (
          /* Empty State */
          <div className="max-w-2xl mx-auto py-12 md:py-20">
            <Card className="overflow-hidden">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="mb-6">
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                      <Store className="h-16 w-16 text-gray-400" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  No shops yet!
                </h2>

                {generatingMessage ? (
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Loader2 className="h-5 w-5 animate-spin text-taja-primary" />
                    <p className="text-gray-600">Generating message...</p>
                  </div>
                ) : emptyStateMessage ? (
                  <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                    {emptyStateMessage}
                  </p>
                ) : (
                  <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                    Be the first to create your own shop and start selling on Taja.Shop. Join our community of sellers and showcase your unique products to buyers across Nigeria.
                  </p>
                )}

                <Button
                  onClick={handleCreateShop}
                  size="lg"
                  variant="gradient"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Be the First to Create a Shop
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Shops Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {shops.map((shop) => (
                <ShopCard key={shop._id} shop={shop} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  variant="outline"
                  className="min-w-[200px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Shops"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

