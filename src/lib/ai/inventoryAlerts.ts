/**
 * AI-Powered Inventory Alerts & Predictions
 * 
 * Features:
 * 1. Low stock alerts based on sales velocity
 * 2. Overstock warnings
 * 3. Demand forecasting
 * 4. Reorder recommendations
 * 5. Seasonal trend detection
 */

import Order from '@/models/Order';
import Product from '@/models/Product';
import { connectDB } from '@/lib/db';

// Types
interface InventoryAlert {
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'reorder_recommended' | 'trending';
  productId: string;
  productName: string;
  currentStock: number;
  recommendedAction: string;
  priority: 'high' | 'medium' | 'low';
  predictedDaysUntilStockout?: number;
  recommendedReorderQuantity?: number;
  reason: string;
}

interface SalesVelocity {
  daily: number;
  weekly: number;
  monthly: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
}

/**
 * Calculate sales velocity for a product
 */
async function calculateSalesVelocity(productId: string): Promise<SalesVelocity> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Get sales in different time periods
  const [monthlySales, weeklySales, dailySales, previousWeekSales] = await Promise.all([
    // Monthly
    Order.aggregate([
      {
        $match: {
          'items.product': productId,
          status: { $in: ['completed', 'delivered', 'shipped'] },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.product': productId } },
      { $group: { _id: null, total: { $sum: '$items.quantity' } } },
    ]),
    // Weekly
    Order.aggregate([
      {
        $match: {
          'items.product': productId,
          status: { $in: ['completed', 'delivered', 'shipped'] },
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.product': productId } },
      { $group: { _id: null, total: { $sum: '$items.quantity' } } },
    ]),
    // Daily (last 24 hours)
    Order.aggregate([
      {
        $match: {
          'items.product': productId,
          status: { $in: ['completed', 'delivered', 'shipped'] },
          createdAt: { $gte: oneDayAgo },
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.product': productId } },
      { $group: { _id: null, total: { $sum: '$items.quantity' } } },
    ]),
    // Previous week (for trend)
    Order.aggregate([
      {
        $match: {
          'items.product': productId,
          status: { $in: ['completed', 'delivered', 'shipped'] },
          createdAt: {
            $gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
            $lt: sevenDaysAgo,
          },
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.product': productId } },
      { $group: { _id: null, total: { $sum: '$items.quantity' } } },
    ]),
  ]);

  const monthly = monthlySales[0]?.total || 0;
  const weekly = weeklySales[0]?.total || 0;
  const daily = dailySales[0]?.total || 0;
  const previousWeek = previousWeekSales[0]?.total || 0;

  // Calculate trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let trendPercentage = 0;

  if (previousWeek > 0) {
    trendPercentage = ((weekly - previousWeek) / previousWeek) * 100;
    if (trendPercentage > 20) trend = 'increasing';
    else if (trendPercentage < -20) trend = 'decreasing';
  }

  return {
    daily: daily || weekly / 7 || monthly / 30,
    weekly,
    monthly,
    trend,
    trendPercentage,
  };
}

/**
 * Predict days until stockout
 */
function predictStockout(currentStock: number, velocity: SalesVelocity): number | null {
  const dailyRate = velocity.daily || velocity.weekly / 7 || velocity.monthly / 30;
  
  if (dailyRate <= 0) return null;
  
  return Math.floor(currentStock / dailyRate);
}

/**
 * Calculate recommended reorder quantity
 */
function calculateReorderQuantity(
  velocity: SalesVelocity,
  currentStock: number,
  leadTimeDays: number = 7
): number {
  // Base on monthly velocity + safety stock
  const monthlyDemand = velocity.monthly || velocity.weekly * 4;
  const dailyDemand = monthlyDemand / 30;
  
  // Reorder point: cover lead time + 30 days safety stock
  const targetStock = (dailyDemand * leadTimeDays) + (dailyDemand * 30);
  
  // If trending up, add buffer
  const trendBuffer = velocity.trend === 'increasing' ? 1.2 : 1;
  
  const reorderQty = Math.ceil((targetStock - currentStock) * trendBuffer);
  
  return Math.max(0, reorderQty);
}

/**
 * Generate inventory alerts for all products
 */
export async function generateInventoryAlerts(
  sellerId?: string
): Promise<InventoryAlert[]> {
  await connectDB();

  const alerts: InventoryAlert[] = [];

  // Build query
  const query: any = { status: 'active' };
  if (sellerId) {
    query.seller = sellerId;
  }

  // Get all products with their orders
  const products = await Product.find(query)
    .select('_id title quantity seller shop')
    .lean();

  for (const product of products) {
    try {
      const velocity = await calculateSalesVelocity(product._id.toString());
      const currentStock = product.quantity || 0;

      // Skip if no sales data and stock is healthy
      if (velocity.monthly === 0 && currentStock > 10) {
        continue;
      }

      // Check for out of stock
      if (currentStock === 0) {
        alerts.push({
          type: 'out_of_stock',
          productId: product._id.toString(),
          productName: product.title,
          currentStock: 0,
          recommendedAction: 'Restock immediately or mark as out of stock',
          priority: 'high',
          reason: 'Product is completely out of stock',
        });
        continue;
      }

      // Check for low stock
      const daysUntilStockout = predictStockout(currentStock, velocity);
      
      if (daysUntilStockout !== null && daysUntilStockout <= 7) {
        const reorderQty = calculateReorderQuantity(velocity, currentStock);
        
        alerts.push({
          type: 'low_stock',
          productId: product._id.toString(),
          productName: product.title,
          currentStock,
          recommendedAction: `Reorder ${reorderQty} units`,
          priority: daysUntilStockout <= 3 ? 'high' : 'medium',
          predictedDaysUntilStockout: daysUntilStockout,
          recommendedReorderQuantity: reorderQty,
          reason: `Only ${daysUntilStockout} days of stock remaining at current sales rate`,
        });
        continue;
      }

      // Check for overstock
      if (currentStock > 100 && velocity.monthly < 5) {
        alerts.push({
          type: 'overstock',
          productId: product._id.toString(),
          productName: product.title,
          currentStock,
          recommendedAction: 'Consider promotion or discount to clear inventory',
          priority: 'low',
          reason: `High inventory (${currentStock} units) with low sales (${velocity.monthly}/month)`,
        });
        continue;
      }

      // Check for trending products
      if (velocity.trend === 'increasing' && velocity.trendPercentage > 50) {
        const reorderQty = calculateReorderQuantity(velocity, currentStock);
        
        if (currentStock < reorderQty) {
          alerts.push({
            type: 'trending',
            productId: product._id.toString(),
            productName: product.title,
            currentStock,
            recommendedAction: `Increase stock - trending up ${Math.round(velocity.trendPercentage)}%`,
            priority: 'medium',
            recommendedReorderQuantity: reorderQty,
            reason: `Sales trending up ${Math.round(velocity.trendPercentage)}% - ensure adequate stock`,
          });
        }
      }

      // General reorder recommendation
      if (daysUntilStockout !== null && daysUntilStockout <= 14 && currentStock > 0) {
        const reorderQty = calculateReorderQuantity(velocity, currentStock);
        
        // Only add if not already flagged as low stock
        if (daysUntilStockout > 7) {
          alerts.push({
            type: 'reorder_recommended',
            productId: product._id.toString(),
            productName: product.title,
            currentStock,
            recommendedAction: `Plan to reorder ${reorderQty} units`,
            priority: 'low',
            predictedDaysUntilStockout: daysUntilStockout,
            recommendedReorderQuantity: reorderQty,
            reason: `Stock will run low in ${daysUntilStockout} days`,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to analyze product ${product._id}:`, error);
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Get inventory summary for dashboard
 */
export async function getInventorySummary(
  sellerId?: string
): Promise<{
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  totalInventoryValue: number;
  alerts: InventoryAlert[];
}> {
  await connectDB();

  const query: any = { status: 'active' };
  if (sellerId) {
    query.seller = sellerId;
  }

  const [products, alerts] = await Promise.all([
    Product.find(query).select('quantity price').lean(),
    generateInventoryAlerts(sellerId),
  ]);

  const totalProducts = products.length;
  const lowStockCount = alerts.filter(a => a.type === 'low_stock').length;
  const outOfStockCount = alerts.filter(a => a.type === 'out_of_stock').length;
  const overstockCount = alerts.filter(a => a.type === 'overstock').length;
  
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + (p.quantity || 0) * (p.price || 0),
    0
  );

  return {
    totalProducts,
    lowStockCount,
    outOfStockCount,
    overstockCount,
    totalInventoryValue,
    alerts: alerts.slice(0, 10), // Top 10 alerts
  };
}

/**
 * Get demand forecast for a product
 */
export async function getDemandForecast(
  productId: string,
  days: number = 30
): Promise<{
  predictedDemand: number;
  confidence: number;
  dailyBreakdown: number[];
  factors: string[];
}> {
  await connectDB();

  const velocity = await calculateSalesVelocity(productId);
  
  // Base prediction on recent velocity
  const dailyRate = velocity.daily || velocity.weekly / 7 || 1;
  
  // Adjust for trend
  let trendMultiplier = 1;
  if (velocity.trend === 'increasing') {
    trendMultiplier = 1 + (velocity.trendPercentage / 100);
  } else if (velocity.trend === 'decreasing') {
    trendMultiplier = 1 - (Math.abs(velocity.trendPercentage) / 100);
  }

  // Generate daily breakdown
  const dailyBreakdown: number[] = [];
  let totalDemand = 0;
  
  for (let i = 0; i < days; i++) {
    // Add some randomness (±20%)
    const randomFactor = 0.8 + Math.random() * 0.4;
    const dayDemand = Math.max(0, Math.round(dailyRate * trendMultiplier * randomFactor));
    dailyBreakdown.push(dayDemand);
    totalDemand += dayDemand;
  }

  // Calculate confidence based on data quality
  let confidence = 50;
  if (velocity.monthly > 10) confidence += 20;
  if (velocity.trend !== 'stable') confidence += 10;
  if (days <= 7) confidence += 20;

  const factors: string[] = [];
  if (velocity.trend === 'increasing') factors.push('Sales trending up');
  if (velocity.trend === 'decreasing') factors.push('Sales declining');
  if (velocity.monthly < 5) factors.push('Limited historical data');
  factors.push(`Based on ${velocity.monthly} sales in last 30 days`);

  return {
    predictedDemand: totalDemand,
    confidence: Math.min(95, confidence),
    dailyBreakdown,
    factors,
  };
}

/**
 * Get seasonal trends
 */
export async function getSeasonalTrends(
  category?: string
): Promise<{
  currentSeason: string;
  trendingCategories: string[];
  decliningCategories: string[];
  recommendations: string[];
}> {
  const now = new Date();
  const month = now.getMonth();
  
  // Determine season
  let currentSeason = 'Regular';
  if (month >= 10 || month <= 1) currentSeason = 'Holiday/Festive';
  else if (month >= 6 && month <= 8) currentSeason = 'Summer';
  else if (month >= 2 && month <= 4) currentSeason = 'Spring';

  // This would typically analyze historical data
  // For now, return seasonal guidance
  return {
    currentSeason,
    trendingCategories: ['Holiday Decor', 'Gift Items', 'Winter Clothing'],
    decliningCategories: ['Summer Wear', 'Outdoor Furniture'],
    recommendations: [
      'Stock up on festive season items',
      'Plan end-of-year promotions',
      'Prepare for increased order volume',
    ],
  };
}
