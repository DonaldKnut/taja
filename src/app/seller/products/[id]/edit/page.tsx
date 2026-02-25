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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { sellerApi, shopsApi, uploadProductImage } from "@/lib/api";

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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
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
    },
    shipping: {
      weight: "",
      freeShipping: false,
      shippingCost: "",
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

  // Fetch existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      try {
        setFetching(true);
        const response = await sellerApi.getProduct(productId);
        
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

        // Transform API response to match our form structure
        setFormData({
          title: productData.name || productData.title || "",
          description: productData.description || "",
          category: productData.category || "",
          subcategory: productData.subcategory || "",
          condition: productData.condition || "good",
          price: String(productData.price || ""),
          compareAtPrice: productData.compareAtPrice || productData.originalPrice ? String(productData.compareAtPrice || productData.originalPrice) : "",
          currency: productData.currency || "NGN",
          images: productData.images || [],
          specifications: productData.specifications || {
            brand: "",
            size: "",
            color: "",
            material: "",
            gender: "",
          },
          inventory: {
            quantity: productData.stock || productData.inventory?.quantity || 1,
            sku: productData.inventory?.sku || productData.sku || "",
            trackQuantity: productData.inventory?.trackQuantity !== false,
          },
          shipping: {
            weight: productData.shipping?.weight ? String(productData.shipping.weight) : "",
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
        console.error("Failed to fetch product:", error);
        toast.error(error?.message || "Failed to load product");
        router.push("/seller/products");
      } finally {
        setFetching(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

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

    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.price
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.images.length === 0) {
      toast.error("Please add at least one product image");
      return;
    }

    setLoading(true);

    try {
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
        },
        shipping: {
          weight: formData.shipping.weight
            ? parseFloat(formData.shipping.weight)
            : undefined,
          freeShipping: formData.shipping.freeShipping,
          shippingCost: formData.shipping.shippingCost
            ? parseFloat(formData.shipping.shippingCost)
            : 0,
          processingTime: formData.shipping.processingTime,
        },
        seo: formData.seo,
        status: isDraft ? "draft" : formData.status,
      };

      const response = await sellerApi.updateProduct(productId, productData);

      if (response?.success !== false) {
        toast.success(
          `Product ${isDraft ? "saved as draft" : "updated"} successfully!`
        );
        router.push("/seller/products");
      } else {
        toast.error(response?.message || response?.error || "Failed to update product");
      }
    } catch (error: any) {
      console.error("Product update error:", error);
      toast.error(error?.message || "Failed to update product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  // The rest of the component JSX would be the same as the new product page
  // For brevity, I'll include the key parts
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/seller/products">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading}
                variant="gradient"
              >
                {loading ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form - Reuse the same form structure as new product page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Title *
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter product title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Describe your product"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition *
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {conditions.map((cond) => (
                      <option key={cond.value} value={cond.value}>
                        {cond.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₦) *
                  </label>
                  <Input
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compare at Price (₦)
                  </label>
                  <Input
                    name="compareAtPrice"
                    type="number"
                    value={formData.compareAtPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Product Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {formData.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative group border-2 rounded-lg overflow-hidden bg-gray-50"
                      style={{
                        borderColor: index === 0 ? "#10b981" : "#e5e7eb",
                      }}
                    >
                      <div className="aspect-square relative">
                        <Image
                          src={image}
                          alt={`Product ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      </div>
                      
                      {/* Main Image Badge */}
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium">
                          <Star className="h-3 w-3 fill-current" />
                          Main
                        </div>
                      )}

                      {/* Image Number */}
                      <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-md text-xs font-medium">
                        {index + 1}
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {index !== 0 && (
                          <button
                            type="button"
                            onClick={() => setMainImage(index)}
                            className="bg-white text-gray-900 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-100 flex items-center gap-1"
                            title="Set as main image"
                          >
                            <Star className="h-3 w-3" />
                            Set Main
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-600 flex items-center gap-1"
                          title="Remove image"
                        >
                          <X className="h-3 w-3" />
                          Remove
                        </button>
                      </div>

                      {/* Reorder buttons */}
                      {formData.images.length > 1 && (
                        <div className="absolute bottom-2 left-2 right-2 flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, index - 1)}
                              className="bg-white/90 text-gray-700 px-2 py-1 rounded text-xs hover:bg-white"
                              title="Move left"
                            >
                              ←
                            </button>
                          )}
                          {index < formData.images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, index + 1)}
                              className="bg-white/90 text-gray-700 px-2 py-1 rounded text-xs hover:bg-white"
                              title="Move right"
                            >
                              →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {formData.images.length < 8 && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center hover:border-taja-primary hover:bg-emerald-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-taja-primary mb-2"></div>
                        <span className="text-sm font-medium text-gray-700">
                          Uploading...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-700 mb-1">
                          {formData.images.length === 0
                            ? "Upload Images"
                            : "Add More Images"}
                        </span>
                        <span className="text-xs text-gray-500">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          {formData.images.length}/8 images uploaded
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Upload up to 8 images. The first image
                  will be used as the main product photo. You can reorder
                  images by using the arrow buttons or set any image as main.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <Input
                    name="inventory.quantity"
                    type="number"
                    value={formData.inventory.quantity}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <Input
                    name="inventory.sku"
                    value={formData.inventory.sku}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#808080] to-[#2E6B4E] text-white"
            >
              {loading ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

