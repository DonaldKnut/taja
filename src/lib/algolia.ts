/**
 * Algolia Search Configuration
 * 
 * This module provides:
 * - Algolia client initialization
 * - Product index configuration
 * - Search helpers
 * - Sync functions for keeping products in sync
 */

import algoliasearch from 'algoliasearch';

// Initialize Algolia client
const appId = process.env.ALGOLIA_APP_ID;
const apiKey = process.env.ALGOLIA_API_KEY;
const searchKey = process.env.ALGOLIA_SEARCH_KEY;

if (!appId || !apiKey) {
  console.warn('Algolia credentials not configured. Search will be disabled.');
}

// Admin client (for indexing)
export const algoliaClient = appId && apiKey 
  ? algoliasearch(appId, apiKey)
  : null;

// Search-only client (for frontend)
export const algoliaSearchClient = appId && searchKey
  ? algoliasearch(appId, searchKey)
  : algoliaClient;

// Index names
export const INDICES = {
  PRODUCTS: 'products',
  PRODUCTS_SUGGESTIONS: 'products_query_suggestions',
} as const;

/**
 * Get product index
 */
export function getProductIndex() {
  if (!algoliaClient) {
    throw new Error('Algolia not configured');
  }
  return algoliaClient.initIndex(INDICES.PRODUCTS);
}

/**
 * Get suggestions index
 */
export function getSuggestionsIndex() {
  if (!algoliaClient) {
    throw new Error('Algolia not configured');
  }
  return algoliaClient.initIndex(INDICES.PRODUCTS_SUGGESTIONS);
}

/**
 * Product index settings
 * Optimized for e-commerce search
 */
export const PRODUCT_INDEX_SETTINGS = {
  // Searchable attributes (order matters - first = most important)
  searchableAttributes: [
    'title',              // Product name (highest priority)
    'description',        // Product description
    'tags',               // Search tags
    'category.name',      // Category name
    'shop.shopName',      // Shop name
    'sku',                // Product SKU
  ],

  // Attributes for faceting (filtering)
  attributesForFaceting: [
    'filterOnly(category.slug)',     // Category filter
    'filterOnly(shop.shopSlug)',     // Shop filter
    'filterOnly(priceRange)',        // Price range filter
    'filterOnly(rating)',            // Rating filter
    'filterOnly(location.state)',    // Location filter
    'filterOnly(isAvailable)',       // Availability filter
    'filterOnly(hasDiscount)',       // Discount filter
    'searchable(tags)',              // Tag search + filter
  ],

  // Ranking formula
  customRanking: [
    'desc(createdAt)',      // Newest first
    'desc(soldCount)',      // Best selling
    'desc(rating)',         // Highest rated
    'desc(reviewCount)',    // Most reviewed
  ],

  // Default ranking
  ranking: [
    'typo',
    'words',
    'filters',
    'proximity',
    'attribute',
    'exact',
    'custom',
  ],

  // Highlighting
  attributesToHighlight: ['title', 'description'],
  highlightPreTag: '<mark class="search-highlight">',
  highlightPostTag: '</mark>',

  // Snippetting
  attributesToSnippet: ['description:50'],
  snippetEllipsisText: '…',

  // Pagination
  hitsPerPage: 20,

  // Typo tolerance
  typoTolerance: 'true',
  minWordSizefor1Typo: 4,
  minWordSizefor2Typos: 8,

  // Synonyms
  synonyms: [
    ['phone', 'mobile', 'cellphone', 'smartphone'],
    ['laptop', 'notebook', 'computer'],
    ['shoes', 'footwear', 'sneakers'],
    ['bag', 'handbag', 'purse', 'backpack'],
    ['dress', 'gown', 'frock'],
    ['shirt', 'top', 'blouse'],
    ['pants', 'trousers', 'jeans'],
    ['watch', 'wristwatch', 'timepiece'],
    ['jewelry', 'jewellery', 'accessories'],
    ['makeup', 'cosmetics', 'beauty'],
  ],

  // Query languages
  queryLanguages: ['en'],
  removeStopWords: true,
  ignorePlurals: true,

  // Distinct (for grouping variants)
  distinct: true,
  attributeForDistinct: 'productGroupId',

  // Advanced
  allowTyposOnNumericTokens: false,
  separatorsToIndex: '-_',
  removeWordsIfNoResults: 'allOptional',
};

/**
 * Configure product index settings
 */
export async function configureProductIndex(): Promise<void> {
  if (!algoliaClient) {
    console.warn('Algolia not configured, skipping index configuration');
    return;
  }

  const index = getProductIndex();
  
  try {
    await index.setSettings(PRODUCT_INDEX_SETTINGS);
    console.log('Algolia product index configured successfully');
  } catch (error) {
    console.error('Failed to configure Algolia index:', error);
    throw error;
  }
}

/**
 * Transform MongoDB product to Algolia record
 */
export function transformProductForAlgolia(product: any): any {
  return {
    objectID: product._id.toString(),
    
    // Basic info
    title: product.title,
    description: product.description,
    slug: product.slug,
    sku: product.sku,
    
    // Pricing
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    hasDiscount: product.compareAtPrice && product.compareAtPrice > product.price,
    discountPercentage: product.compareAtPrice 
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0,
    priceRange: getPriceRange(product.price),
    
    // Inventory
    quantity: product.quantity,
    isAvailable: product.status === 'active' && product.quantity > 0,
    status: product.status,
    
    // Media
    images: product.images || [],
    thumbnail: product.images?.[0]?.url || null,
    
    // Category
    category: product.category ? {
      id: product.category._id?.toString() || product.category.toString(),
      name: product.category.name || '',
      slug: product.category.slug || '',
    } : null,
    
    // Shop
    shop: product.shop ? {
      id: product.shop._id?.toString() || product.shop.toString(),
      shopName: product.shop.shopName || '',
      shopSlug: product.shop.shopSlug || '',
      logo: product.shop.logo || '',
      isVerified: product.shop.isVerified || false,
    } : null,
    
    // Location
    location: product.shop?.location || {
      state: '',
      city: '',
    },
    
    // Ratings
    rating: product.rating?.average || 0,
    reviewCount: product.rating?.count || 0,
    
    // Stats
    soldCount: product.soldCount || 0,
    viewCount: product.viewCount || 0,
    
    // Tags
    tags: product.tags || [],
    
    // Timestamps
    createdAt: product.createdAt?.getTime() || Date.now(),
    updatedAt: product.updatedAt?.getTime() || Date.now(),
    
    // Grouping (for variants)
    productGroupId: product.productGroupId || product._id.toString(),
  };
}

/**
 * Get price range for faceting
 */
function getPriceRange(price: number): string {
  if (price < 5000) return 'under-5k';
  if (price < 10000) return '5k-10k';
  if (price < 25000) return '10k-25k';
  if (price < 50000) return '25k-50k';
  if (price < 100000) return '50k-100k';
  return 'over-100k';
}

/**
 * Sync single product to Algolia
 */
export async function syncProductToAlgolia(product: any): Promise<void> {
  if (!algoliaClient) {
    console.warn('Algolia not configured, skipping product sync');
    return;
  }

  const index = getProductIndex();
  const record = transformProductForAlgolia(product);

  try {
    await index.saveObject(record);
  } catch (error) {
    console.error('Failed to sync product to Algolia:', error);
    throw error;
  }
}

/**
 * Sync multiple products to Algolia
 */
export async function syncProductsToAlgolia(products: any[]): Promise<void> {
  if (!algoliaClient) {
    console.warn('Algolia not configured, skipping product sync');
    return;
  }

  if (products.length === 0) return;

  const index = getProductIndex();
  const records = products.map(transformProductForAlgolia);

  try {
    await index.saveObjects(records);
    console.log(`Synced ${records.length} products to Algolia`);
  } catch (error) {
    console.error('Failed to sync products to Algolia:', error);
    throw error;
  }
}

/**
 * Delete product from Algolia
 */
export async function deleteProductFromAlgolia(productId: string): Promise<void> {
  if (!algoliaClient) {
    console.warn('Algolia not configured, skipping product delete');
    return;
  }

  const index = getProductIndex();

  try {
    await index.deleteObject(productId);
  } catch (error) {
    console.error('Failed to delete product from Algolia:', error);
    throw error;
  }
}

/**
 * Clear all products from Algolia
 */
export async function clearAlgoliaIndex(): Promise<void> {
  if (!algoliaClient) {
    console.warn('Algolia not configured, skipping index clear');
    return;
  }

  const index = getProductIndex();

  try {
    await index.clearObjects();
    console.log('Algolia index cleared');
  } catch (error) {
    console.error('Failed to clear Algolia index:', error);
    throw error;
  }
}

/**
 * Search products (server-side)
 */
export async function searchProducts(
  query: string,
  options: {
    filters?: string;
    facets?: string[];
    page?: number;
    hitsPerPage?: number;
    sortBy?: string;
  } = {}
) {
  if (!algoliaClient) {
    throw new Error('Algolia not configured');
  }

  const index = getProductIndex();
  
  const searchParams: any = {
    filters: options.filters,
    facets: options.facets,
    page: options.page || 0,
    hitsPerPage: options.hitsPerPage || 20,
  };

  // Apply sorting
  if (options.sortBy) {
    switch (options.sortBy) {
      case 'price_asc':
        searchParams.replicas = 'products_price_asc';
        break;
      case 'price_desc':
        searchParams.replicas = 'products_price_desc';
        break;
      case 'newest':
        searchParams.replicas = 'products_newest';
        break;
      case 'popular':
        searchParams.replicas = 'products_popular';
        break;
      case 'rating':
        searchParams.replicas = 'products_rating';
        break;
    }
  }

  try {
    const result = await index.search(query, searchParams);
    return {
      hits: result.hits,
      nbHits: result.nbHits,
      page: result.page,
      nbPages: result.nbPages,
      hitsPerPage: result.hitsPerPage,
      facets: result.facets,
      query: result.query,
    };
  } catch (error) {
    console.error('Algolia search error:', error);
    throw error;
  }
}

/**
 * Get search suggestions
 */
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
  if (!algoliaClient) {
    return [];
  }

  try {
    const index = getProductIndex();
    const result = await index.search(query, {
      hitsPerPage: limit,
      attributesToRetrieve: ['title'],
    });

    return result.hits.map((hit: any) => hit.title);
  } catch (error) {
    console.error('Failed to get search suggestions:', error);
    return [];
  }
}

/**
 * Get popular searches (requires analytics - placeholder)
 */
export async function getPopularSearches(limit: number = 10): Promise<string[]> {
  // This would typically use Algolia Analytics API
  // For now, return empty array
  return [];
}
