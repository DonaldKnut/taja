"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  Eye,
  Trash2,
  Search,
  Filter,
  Grid,
  List,
  Star,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { wishlistApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { EmptyState, LoadingSkeleton, PageHeader, SearchFilterBar } from "@/components/common";
import { normalizeApiResponse } from "@/lib/utils/apiResponse";

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  seller: {
    name: string;
    shop: string;
    rating: number;
  };
  addedDate: string;
  inStock: boolean;
  category: string;
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filteredItems, setFilteredItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const response = await wishlistApi.getAll({ limit: 100 });
        
        const normalized = normalizeApiResponse(response);
        const transformedItems = normalized.data.map((item: any) => ({
          id: item._id || item.id,
          productId: item.product?._id || item.productId || item.product?.id || "",
          name: item.product?.name || item.name || item.productName || "Unknown Product",
          price: item.product?.price || item.price || 0,
          originalPrice: item.product?.originalPrice || item.originalPrice || item.product?.original_price,
          image: item.product?.images?.[0] || item.image || item.product?.image || "/placeholder-product.jpg",
          seller: {
            name: item.product?.seller?.name || item.seller?.name || "Unknown Seller",
            shop: item.product?.shop?.shopName || item.shopName || item.shop?.name || "Unknown Shop",
            rating: item.product?.rating || item.rating || item.seller?.rating || 0,
          },
          addedDate: item.createdAt || item.created_at || item.addedDate || new Date().toISOString(),
          inStock: item.product?.inStock !== false && item.product?.stock > 0,
          category: item.product?.category || item.category || "uncategorized",
        }));

        setWishlistItems(transformedItems);
      } catch (error: any) {
        console.error("Failed to fetch wishlist:", error);
        // Don't show toast for 401/403 errors (handled by api.ts)
        if (error?.status !== 401 && error?.status !== 403) {
          toast.error(error?.message || "Failed to load wishlist");
        }
        setWishlistItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  useEffect(() => {
    let filtered = wishlistItems;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.seller.shop.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    setFilteredItems(filtered);
  }, [wishlistItems, searchTerm, categoryFilter]);

  const handleRemoveFromWishlist = async (itemId: string) => {
    setLoading(true);
    try {
      await wishlistApi.remove(itemId);
      setWishlistItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success("Item removed from wishlist");
    } catch (error: any) {
      console.error("Failed to remove from wishlist:", error);
      toast.error(error?.message || "Failed to remove item from wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    setLoading(true);
    try {
      // TODO: Add to cart via API
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Remove from wishlist after adding to cart
      setWishlistItems((prev) =>
        prev.filter((wishlistItem) => wishlistItem.id !== item.id)
      );
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Wishlist"
        description={`${wishlistItems.length} items saved for later`}
        action={{
          label: viewMode === "grid" ? "List View" : "Grid View",
          onClick: () => setViewMode(viewMode === "grid" ? "list" : "grid"),
          variant: "outline",
        }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
        >
          {viewMode === "grid" ? (
            <List className="h-4 w-4" />
          ) : (
            <Grid className="h-4 w-4" />
          )}
        </Button>
      </PageHeader>

      {/* Filters */}
      <SearchFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search wishlist..."
        filters={[
          {
            label: "Category",
            value: categoryFilter,
            options: [
              { value: "all", label: "All Categories" },
              { value: "fashion", label: "Fashion" },
              { value: "electronics", label: "Electronics" },
              { value: "home", label: "Home & Garden" },
              { value: "beauty", label: "Beauty" },
              { value: "sports", label: "Sports" },
            ],
            onChange: setCategoryFilter,
          },
        ]}
      />

      {/* Loading State */}
      {loading && filteredItems.length === 0 && (
        <LoadingSkeleton variant="grid" count={4} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
      )}

      {/* Wishlist Items */}
      {!loading && filteredItems.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
          }
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white shadow rounded-lg ${
                viewMode === "list" ? "flex" : ""
              }`}
            >
              {viewMode === "grid" ? (
                // Grid View
                <>
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover object-center group-hover:opacity-75"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => handleRemoveFromWishlist(item.id)}
                        className="text-gray-400 hover:text-red-500"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg font-semibold text-gray-900">
                        ₦{item.price.toLocaleString()}
                      </span>
                      {item.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ₦{item.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 mb-2">
                      {renderStars(item.seller.rating)}
                      <span className="text-xs text-gray-500">
                        ({item.seller.rating})
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      by {item.seller.shop}
                    </p>
                    <div className="flex space-x-2">
                      <Link
                        href={`/product/${item.productId}`}
                        className="flex-1"
                      >
                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        disabled={!item.inStock || loading}
                        onClick={() => handleAddToCart(item)}
                        className="flex-1"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {item.inStock ? "Add to Cart" : "Out of Stock"}
                      </Button>
                    </div>
                    {!item.inStock && (
                      <Badge className="mt-2 bg-red-100 text-red-800">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                // List View
                <>
                  <div className="flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-24 w-24 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-lg font-semibold text-gray-900">
                            ₦{item.price.toLocaleString()}
                          </span>
                          {item.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ₦{item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          {renderStars(item.seller.rating)}
                          <span className="text-sm text-gray-500">
                            {item.seller.rating} • {item.seller.shop}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Added on{" "}
                          {new Date(item.addedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRemoveFromWishlist(item.id)}
                          className="text-gray-400 hover:text-red-500"
                          disabled={loading}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        <Link href={`/product/${item.productId}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          disabled={!item.inStock || loading}
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {item.inStock ? "Add to Cart" : "Out of Stock"}
                        </Button>
                      </div>
                    </div>
                    {!item.inStock && (
                      <Badge className="mt-2 bg-red-100 text-red-800">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center mb-6">
              <Heart className="h-12 w-12 text-pink-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {searchTerm || categoryFilter !== "all"
                ? "No items found"
                : "Be the first to create!"}
            </h3>
            <p className="text-gray-600 mb-8">
              {searchTerm || categoryFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "You haven't added any items to your wishlist yet. Start saving your favorite products!"}
            </p>
            {!searchTerm && categoryFilter === "all" && (
              <Link href="/marketplace">
                <Button size="lg" variant="gradient">
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Empty State - only show if not loading and no items */}
      {!loading && wishlistItems.length === 0 && (
        <EmptyState
          icon={Heart}
          title={searchTerm || categoryFilter !== "all" ? "No items found" : "Be the first to create!"}
          description={searchTerm || categoryFilter !== "all"
            ? "Try adjusting your search or filter criteria."
            : "You haven't added any items to your wishlist yet. Start saving your favorite products!"}
          actionLabel={!searchTerm && categoryFilter === "all" ? "Browse Products" : undefined}
          actionHref={!searchTerm && categoryFilter === "all" ? "/marketplace" : undefined}
          iconColor="text-pink-600"
          iconBgColor="bg-gradient-to-br from-pink-100 to-pink-50"
        />
      )}
    </div>
  );
}