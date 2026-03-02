/**
 * Search Analytics Module
 * 
 * Tracks search queries, clicks, and conversions for insights.
 * Stores data in MongoDB for analysis.
 */

import mongoose, { Schema, Document } from 'mongoose';

// Search analytics schema
interface ISearchAnalytics extends Document {
  query: string;
  userId?: mongoose.Types.ObjectId;
  sessionId: string;
  resultsCount: number;
  clickedProductId?: mongoose.Types.ObjectId;
  clickedPosition?: number;
  converted: boolean;
  filtersUsed: Record<string, any>;
  timestamp: Date;
  responseTime: number;
}

const SearchAnalyticsSchema = new Schema<ISearchAnalytics>({
  query: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, required: true, index: true },
  resultsCount: { type: Number, default: 0 },
  clickedProductId: { type: Schema.Types.ObjectId, ref: 'Product' },
  clickedPosition: { type: Number },
  converted: { type: Boolean, default: false },
  filtersUsed: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true },
  responseTime: { type: Number, default: 0 },
});

// Indexes for analytics queries
SearchAnalyticsSchema.index({ query: 1, timestamp: -1 });
SearchAnalyticsSchema.index({ timestamp: -1 });

const SearchAnalytics = mongoose.models.SearchAnalytics || 
  mongoose.model<ISearchAnalytics>('SearchAnalytics', SearchAnalyticsSchema);

export default SearchAnalytics;

/**
 * Track a search query
 */
export async function trackSearch(params: {
  query: string;
  userId?: string;
  sessionId: string;
  resultsCount: number;
  filters?: Record<string, any>;
  responseTime: number;
}): Promise<void> {
  try {
    await SearchAnalytics.create({
      query: params.query.toLowerCase().trim(),
      userId: params.userId,
      sessionId: params.sessionId,
      resultsCount: params.resultsCount,
      filtersUsed: params.filters || {},
      responseTime: params.responseTime,
    });
  } catch (error) {
    console.error('Failed to track search:', error);
  }
}

/**
 * Track a product click from search results
 */
export async function trackSearchClick(params: {
  query: string;
  productId: string;
  position: number;
  userId?: string;
  sessionId: string;
}): Promise<void> {
  try {
    // Find the most recent search for this session/query and update it
    await SearchAnalytics.findOneAndUpdate(
      {
        query: params.query.toLowerCase().trim(),
        sessionId: params.sessionId,
        clickedProductId: { $exists: false },
      },
      {
        clickedProductId: params.productId,
        clickedPosition: params.position,
      },
      { sort: { timestamp: -1 } }
    );
  } catch (error) {
    console.error('Failed to track search click:', error);
  }
}

/**
 * Track a conversion (purchase) from search
 */
export async function trackSearchConversion(params: {
  query: string;
  productId: string;
  userId?: string;
  sessionId: string;
}): Promise<void> {
  try {
    await SearchAnalytics.findOneAndUpdate(
      {
        query: params.query.toLowerCase().trim(),
        sessionId: params.sessionId,
        clickedProductId: params.productId,
      },
      { converted: true },
      { sort: { timestamp: -1 } }
    );
  } catch (error) {
    console.error('Failed to track search conversion:', error);
  }
}

/**
 * Get popular searches
 */
export async function getPopularSearches(
  days: number = 30,
  limit: number = 20
): Promise<Array<{ query: string; count: number; clicks: number; conversions: number }>> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const results = await SearchAnalytics.aggregate([
      {
        $match: {
          timestamp: { $gte: since },
          query: { $exists: true, $ne: '' },
        },
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 },
          clicks: { $sum: { $cond: [{ $ne: ['$clickedProductId', null] }, 1, 0] } },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } },
        },
      },
      {
        $project: {
          query: '$_id',
          count: 1,
          clicks: 1,
          conversions: 1,
          clickRate: { $divide: ['$clicks', '$count'] },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    return results;
  } catch (error) {
    console.error('Failed to get popular searches:', error);
    return [];
  }
}

/**
 * Get searches with no results
 */
export async function getSearchesWithNoResults(
  days: number = 30,
  limit: number = 20
): Promise<Array<{ query: string; count: number }>> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const results = await SearchAnalytics.aggregate([
      {
        $match: {
          timestamp: { $gte: since },
          resultsCount: 0,
        },
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    return results.map((r) => ({ query: r._id, count: r.count }));
  } catch (error) {
    console.error('Failed to get searches with no results:', error);
    return [];
  }
}

/**
 * Get search performance metrics
 */
export async function getSearchMetrics(days: number = 30): Promise<{
  totalSearches: number;
  uniqueQueries: number;
  clickThroughRate: number;
  conversionRate: number;
  avgResponseTime: number;
}> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totals] = await SearchAnalytics.aggregate([
      {
        $match: {
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: null,
          totalSearches: { $sum: 1 },
          uniqueQueries: { $addToSet: '$query' },
          clicks: { $sum: { $cond: [{ $ne: ['$clickedProductId', null] }, 1, 0] } },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } },
          avgResponseTime: { $avg: '$responseTime' },
        },
      },
      {
        $project: {
          totalSearches: 1,
          uniqueQueries: { $size: '$uniqueQueries' },
          clickThroughRate: { $divide: ['$clicks', '$totalSearches'] },
          conversionRate: { $divide: ['$conversions', { $max: ['$clicks', 1] }] },
          avgResponseTime: 1,
        },
      },
    ]);

    return totals || {
      totalSearches: 0,
      uniqueQueries: 0,
      clickThroughRate: 0,
      conversionRate: 0,
      avgResponseTime: 0,
    };
  } catch (error) {
    console.error('Failed to get search metrics:', error);
    return {
      totalSearches: 0,
      uniqueQueries: 0,
      clickThroughRate: 0,
      conversionRate: 0,
      avgResponseTime: 0,
    };
  }
}
