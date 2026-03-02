/**
 * AI Product Recommendations Engine
 * 
 * Provides multiple recommendation strategies:
 * 1. Collaborative Filtering - "Customers who bought X also bought Y"
 * 2. Content-Based - Similar products based on attributes
 * 3. Personalized - Based on user's browsing/purchase history
 * 4. Trending - Popular products in category
 * 5. Cross-Sell - Complementary products
 * 6. Upsell - Higher-value alternatives
 */

import Order from '@/models/Order';
import Product from '@/models/Product';
import { connectDB } from '@/lib/db';

// Types
interface RecommendationOptions {
  type: 'similar' | 'frequently_bought' | 'trending' | 'personalized' | 'cross_sell' | 'upsell';
  limit?: number;
  excludeIds?: string[];
  userId?: string;
}

interface ProductRecommendation {
  productId: string;
  score: number;
  reason: string;
}

/**
 * Get product recommendations
 */
export async function getRecommendations(
  productId: string | null,
  options: RecommendationOptions
): Promise<ProductRecommendation[]> {
  await connectDB();

  const { type, limit = 8, excludeIds = [], userId } = options;

  switch (type) {
    case 'similar':
      return getSimilarProducts(productId!, limit, excludeIds);
    case 'frequently_bought':
      return getFrequentlyBoughtTogether(productId!, limit, excludeIds);
    case 'trending':
      return getTrendingProducts(limit, excludeIds);
    case 'personalized':
      return getPersonalizedRecommendations(userId!, limit, excludeIds);
    case 'cross_sell':
      return getCrossSellProducts(productId!, limit, excludeIds);
    case 'upsell':
      return getUpsellProducts(productId!, limit, excludeIds);
    default:
      return getTrendingProducts(limit, excludeIds);
  }
}

/**
 * Get similar products based on category, tags, and price range
 */
async function getSimilarProducts(
  productId: string,
  limit: number,
  excludeIds: string[]
): Promise<ProductRecommendation[]> {
  const product = await Product.findById(productId).lean();
  if (!product) return [];

  // Find products in same category with similar attributes
  const similarProducts = await Product.find({
    _id: { $nin: [...excludeIds, productId] },
    status: 'active',
    $or: [
      { category: product.category },
      { tags: { $in: product.tags || [] } },
      {
        price: {
          $gte: product.price * 0.7,
          $lte: product.price * 1.3,
        },
      },
    ],
  })
    .select('_id title price images rating category tags')
    .limit(limit * 2)
    .lean();

  // Score and rank products
  const scored = similarProducts.map((p: any) => {
    let score = 0;
    let reasons: string[] = [];

    // Same category
    if (p.category?.toString() === product.category?.toString()) {
      score += 30;
      reasons.push('Same category');
    }

    // Shared tags
    const sharedTags = (p.tags || []).filter((tag: string) => 
      (product.tags || []).includes(tag)
    );
    if (sharedTags.length > 0) {
      score += sharedTags.length * 10;
      reasons.push(`${sharedTags.length} shared tags`);
    }

    // Price similarity (closer = higher score)
    const priceDiff = Math.abs(p.price - product.price) / product.price;
    score += Math.max(0, 20 - priceDiff * 20);

    // Rating bonus
    if (p.rating?.average >= 4) {
      score += 10;
      reasons.push('Highly rated');
    }

    // Popularity bonus
    score += Math.min(10, (p.soldCount || 0) / 10);

    return {
      productId: p._id.toString(),
      score,
      reason: reasons[0] || 'Similar product',
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get "Customers who bought this also bought" recommendations
 * Uses order history to find product associations
 */
async function getFrequentlyBoughtTogether(
  productId: string,
  limit: number,
  excludeIds: string[]
): Promise<ProductRecommendation[]> {
  // Find orders containing this product
  const ordersWithProduct = await Order.find({
    'items.product': productId,
    status: { $in: ['completed', 'delivered'] },
  }).select('items');

  if (ordersWithProduct.length === 0) {
    return getSimilarProducts(productId, limit, excludeIds);
  }

  // Count co-occurrences
  const coOccurrences: Map<string, { count: number; product: any }> = new Map();

  for (const order of ordersWithProduct) {
    for (const item of order.items) {
      const id = item.product.toString();
      if (id !== productId && !excludeIds.includes(id)) {
        if (!coOccurrences.has(id)) {
          coOccurrences.set(id, { count: 0, product: item });
        }
        coOccurrences.get(id)!.count++;
      }
    }
  }

  // Calculate confidence scores
  const totalOrders = ordersWithProduct.length;
  const recommendations: ProductRecommendation[] = [];

  for (const [id, data] of coOccurrences) {
    const confidence = data.count / totalOrders;
    if (confidence >= 0.1) { // At least 10% of orders
      recommendations.push({
        productId: id,
        score: confidence * 100,
        reason: `Bought together ${Math.round(confidence * 100)}% of the time`,
      });
    }
  }

  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get trending products (high sales velocity)
 */
async function getTrendingProducts(
  limit: number,
  excludeIds: string[]
): Promise<ProductRecommendation[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get products with recent sales
  const trending = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
        status: { $in: ['completed', 'delivered'] },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        orderCount: { $sum: 1 },
        quantitySold: { $sum: '$items.quantity' },
      },
    },
    {
      $match: {
        _id: { $nin: excludeIds.map(id => new (require('mongoose').Types.ObjectId)(id)) },
      },
    },
    { $sort: { quantitySold: -1 } },
    { $limit: limit },
  ]);

  return trending.map((t: any) => ({
    productId: t._id.toString(),
    score: t.quantitySold,
    reason: `${t.quantitySold} sold recently`,
  }));
}

/**
 * Get personalized recommendations based on user history
 */
async function getPersonalizedRecommendations(
  userId: string,
  limit: number,
  excludeIds: string[]
): Promise<ProductRecommendation[]> {
  // Get user's purchase history
  const userOrders = await Order.find({
    buyer: userId,
    status: { $in: ['completed', 'delivered'] },
  }).select('items');

  if (userOrders.length === 0) {
    // New user - return trending
    return getTrendingProducts(limit, excludeIds);
  }

  // Extract categories and tags from purchased products
  const purchasedProductIds: string[] = [];
  const categoryCounts: Map<string, number> = new Map();
  const tagCounts: Map<string, number> = new Map();

  for (const order of userOrders) {
    for (const item of order.items) {
      purchasedProductIds.push(item.product.toString());
    }
  }

  // Get full product details
  const purchasedProducts = await Product.find({
    _id: { $in: purchasedProductIds },
  }).select('category tags');

  for (const product of purchasedProducts) {
    if (product.category) {
      const catId = product.category.toString();
      categoryCounts.set(catId, (categoryCounts.get(catId) || 0) + 1);
    }
    for (const tag of product.tags || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  // Get top categories and tags
  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  // Find similar products
  const recommendations = await Product.find({
    _id: { $nin: [...excludeIds, ...purchasedProductIds] },
    status: 'active',
    $or: [
      { category: { $in: topCategories } },
      { tags: { $in: topTags } },
    ],
  })
    .select('_id title price images rating category tags soldCount')
    .limit(limit * 2)
    .lean();

  // Score based on user preferences
  const scored = recommendations.map((p: any) => {
    let score = 0;

    // Category match
    if (topCategories.includes(p.category?.toString())) {
      score += 30;
    }

    // Tag matches
    const matchingTags = (p.tags || []).filter((tag: string) => 
      topTags.includes(tag)
    );
    score += matchingTags.length * 15;

    // Popularity
    score += Math.min(20, (p.soldCount || 0) / 5);

    // Rating
    if (p.rating?.average >= 4.5) score += 10;

    return {
      productId: p._id.toString(),
      score,
      reason: matchingTags.length > 0 
        ? `Based on your interest in ${matchingTags[0]}`
        : 'Recommended for you',
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get cross-sell recommendations (complementary products)
 */
async function getCrossSellProducts(
  productId: string,
  limit: number,
  excludeIds: string[]
): Promise<ProductRecommendation[]> {
  const product = await Product.findById(productId).lean();
  if (!product) return [];

  // Define category complements
  const complements: Record<string, string[]> = {
    'electronics': ['accessories', 'cases', 'chargers'],
    'fashion': ['accessories', 'jewelry', 'bags'],
    'home': ['decor', 'kitchen', 'storage'],
    'beauty': ['skincare', 'tools', 'accessories'],
    'sports': ['accessories', 'nutrition', 'apparel'],
  };

  // Get product category
  const categoryName = product.category?.toString().toLowerCase() || '';
  const complementaryCategories = Object.entries(complements)
    .find(([key]) => categoryName.includes(key))?.[1] || [];

  if (complementaryCategories.length === 0) {
    return getFrequentlyBoughtTogether(productId, limit, excludeIds);
  }

  // Find complementary products
  const crossSell = await Product.find({
    _id: { $nin: [...excludeIds, productId] },
    status: 'active',
    $or: [
      { category: { $in: complementaryCategories } },
      { tags: { $in: complementaryCategories } },
    ],
  })
    .select('_id title price images rating soldCount')
    .sort({ soldCount: -1, rating: -1 })
    .limit(limit)
    .lean();

  return crossSell.map((p: any) => ({
    productId: p._id.toString(),
    score: (p.soldCount || 0) + (p.rating?.average || 0) * 10,
    reason: 'Perfect complement',
  }));
}

/**
 * Get upsell recommendations (higher value alternatives)
 */
async function getUpsellProducts(
  productId: string,
  limit: number,
  excludeIds: string[]
): Promise<ProductRecommendation[]> {
  const product = await Product.findById(productId).lean();
  if (!product) return [];

  // Find higher-priced alternatives in same category
  const upsell = await Product.find({
    _id: { $nin: [...excludeIds, productId] },
    status: 'active',
    category: product.category,
    price: { $gt: product.price },
  })
    .select('_id title price images rating soldCount')
    .sort({ price: 1 })
    .limit(limit)
    .lean();

  return upsell.map((p: any) => ({
    productId: p._id.toString(),
    score: p.price - product.price,
    reason: `Upgrade for ₦${(p.price - product.price).toLocaleString()} more`,
  }));
}

/**
 * Get recommendations for homepage
 */
export async function getHomepageRecommendations(
  userId?: string,
  limit: number = 8
): Promise<{
  trending: ProductRecommendation[];
  personalized: ProductRecommendation[];
  newArrivals: ProductRecommendation[];
}> {
  const excludeIds: string[] = [];

  const [trending, personalized, newArrivals] = await Promise.all([
    getTrendingProducts(limit, excludeIds),
    userId 
      ? getPersonalizedRecommendations(userId, limit, excludeIds)
      : getTrendingProducts(limit, excludeIds),
    getNewArrivals(limit, excludeIds),
  ]);

  return { trending, personalized, newArrivals };
}

/**
 * Get new arrivals
 */
async function getNewArrivals(
  limit: number,
  excludeIds: string[]
): Promise<ProductRecommendation[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newProducts = await Product.find({
    _id: { $nin: excludeIds },
    status: 'active',
    createdAt: { $gte: sevenDaysAgo },
  })
    .select('_id title price images rating createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return newProducts.map((p: any) => ({
    productId: p._id.toString(),
    score: new Date(p.createdAt).getTime(),
    reason: 'New arrival',
  }));
}

/**
 * Record product view for analytics
 */
export async function recordProductView(
  productId: string,
  userId?: string
): Promise<void> {
  try {
    await Product.findByIdAndUpdate(productId, {
      $inc: { viewCount: 1 },
    });

    // Could also store in analytics collection for user history
    if (userId) {
      // Store view in user history for better recommendations
      // Implementation depends on your analytics setup
    }
  } catch (error) {
    console.error('Failed to record product view:', error);
  }
}
