/**
 * Utility functions for handling different API response structures
 * This helps normalize responses from the backend which may have varying formats
 */

export interface NormalizedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Normalize API response to a consistent structure
 * Handles various response formats:
 * - { data: { items: [...] } }
 * - { data: [...] }
 * - { items: [...] }
 * - [...]
 */
export function normalizeApiResponse<T>(response: any): NormalizedResponse<T> {
  let data: T[] = [];
  let total: number | undefined;
  let page: number | undefined;
  let limit: number | undefined;

  // Handle different response structures
  if (response?.data) {
    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (response.data.items) {
      data = response.data.items;
    } else if (response.data.products) {
      data = response.data.products;
    } else if (response.data.orders) {
      data = response.data.orders;
    } else if (response.data.addresses) {
      data = response.data.addresses;
    } else if (response.data.paymentMethods || response.data.cards) {
      data = response.data.paymentMethods || response.data.cards || [];
    } else if (response.data.posts) {
      data = response.data.posts;
    } else if (response.data.comments) {
      data = response.data.comments;
    } else if (response.data.shops) {
      data = response.data.shops;
    } else {
      // Single item wrapped in data
      data = [response.data];
    }

    // Extract pagination info if available
    if (response.data.pagination) {
      total = response.data.pagination.total;
      page = response.data.pagination.page;
      limit = response.data.pagination.limit;
    }
  } else if (response?.items) {
    data = response.items;
  } else if (response?.products) {
    data = response.products;
  } else if (response?.orders) {
    data = response.orders;
  } else if (response?.addresses) {
    data = response.addresses;
  } else if (response?.paymentMethods || response?.cards) {
    data = response.paymentMethods || response.cards || [];
  } else if (response?.posts) {
    data = response.posts;
  } else if (response?.comments) {
    data = response.comments;
  } else if (response?.shops) {
    data = response.shops;
  } else if (Array.isArray(response)) {
    data = response;
  } else if (response) {
    // Single item
    data = [response];
  }

  return { data, total, page, limit };
}

/**
 * Extract a single item from API response
 */
export function normalizeSingleItem<T>(response: any): T | null {
  if (response?.data?.product) return response.data.product;
  if (response?.data?.post) return response.data.post;
  if (response?.data?.shop) return response.data.shop;
  if (response?.data?.user) return response.data.user;
  if (response?.data?.order) return response.data.order;
  if (response?.data) return response.data;
  if (response?.product) return response.product;
  if (response?.post) return response.post;
  if (response?.shop) return response.shop;
  if (response?.user) return response.user;
  if (response?.order) return response.order;
  if (response) return response;
  return null;
}

/**
 * Transform product data to consistent format
 */
export function transformProduct(product: any) {
  return {
    id: product._id || product.id,
    slug: product.slug || product.id,
    title: product.name || product.title || "Product",
    description: product.description || "",
    price: product.price || 0,
    compareAtPrice: product.compareAtPrice || product.originalPrice,
    stock: product.stock || product.inventory?.quantity || 0,
    images: product.images || [],
    condition: product.condition || "good",
    category: product.category || "",
    specifications: product.specifications || {},
    shop: {
      shopName: product.shop?.shopName || product.shop?.name || "Shop",
      shopSlug: product.shop?.slug || product.shopSlug || "",
      averageRating: product.shop?.averageRating || 0,
      verified: product.shop?.verified || product.shop?.isVerified || false,
    },
    reviews: product.reviews || [],
  };
}

/**
 * Transform address data to consistent format
 */
export function transformAddress(address: any) {
  return {
    id: address._id || address.id,
    fullName: address.fullName || address.full_name || "",
    phone: address.phone || "",
    line1: address.line1 || address.street || address.addressLine1 || "",
    line2: address.line2 || address.addressLine2 || "",
    city: address.city || "",
    state: address.state || "",
    country: address.country || "Nigeria",
    postalCode: address.postalCode || address.postal_code || address.zipCode || "",
    type: address.type || "shipping",
    isDefault: address.isDefault || address.is_default || false,
  };
}

/**
 * Transform payment method data to consistent format
 */
export function transformPaymentMethod(method: any) {
  return {
    id: method._id || method.id,
    last4: method.last4 || method.last_4 || method.lastFour || "****",
    brand: method.brand || method.cardBrand || "CARD",
    expMonth: method.expMonth || method.exp_month || method.expiryMonth || 12,
    expYear: method.expYear || method.exp_year || method.expiryYear || new Date().getFullYear() + 3,
    authorizationCode: method.authorizationCode || method.authorization_code || method.authCode,
  };
}

/**
 * Transform order data to consistent format
 */
export function transformOrder(order: any) {
  return {
    id: order._id || order.id,
    orderNumber: order.orderNumber || order.order_number || `TJA-${(order._id || order.id)?.slice(-6) || 'N/A'}`,
    status: order.status || "pending",
    paymentStatus: order.paymentStatus || order.payment_status || "pending",
    total: order.total || order.totalAmount || 0,
    date: order.createdAt || order.created_at || order.date || new Date().toISOString(),
    estimatedDelivery: order.estimatedDelivery || order.estimated_delivery,
    items: order.items?.map((item: any) => ({
      id: item._id || item.id || item.product?._id || item.product?.id,
      name: item.product?.name || item.name || item.productName || "Unknown Product",
      quantity: item.quantity || 1,
      price: item.price || item.unitPrice || 0,
      image: item.product?.images?.[0] || item.image || item.product?.image || "/placeholder-product.jpg",
      seller: {
        name: item.seller?.name || item.seller?.fullName || "Unknown Seller",
        shop: item.seller?.shop?.shopName || item.shopName || "Unknown Shop",
      },
    })) || [],
    shippingAddress: order.shippingAddress || order.shipping_address || {
      street: order.address?.line1 || "",
      city: order.address?.city || "",
      state: order.address?.state || "",
      postalCode: order.address?.postalCode || order.address?.postal_code || "",
    },
  };
}







