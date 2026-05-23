/**
 * Product Search Sync Module
 * 
 * Automatically syncs products to Algolia when they change in MongoDB.
 * Uses Mongoose middleware and manual sync functions.
 */

import Product from '@/models/Product';
import { syncProductToAlgolia, deleteProductFromAlgolia, clearAlgoliaIndex, syncProductsToAlgolia } from '@/lib/algolia';
import connectDB from '@/lib/db';

/**
 * Sync a single product to Algolia
 * Call this after product creation or update
 */
export async function syncProduct(productId: string): Promise<void> {
  try {
    await connectDB();
    
    const product = await Product.findById(productId)
      .populate('category', 'name slug')
      .populate('shop', 'shopName shopSlug logo isVerified location');

    if (!product) {
      console.warn(`Product ${productId} not found, skipping sync`);
      return;
    }

    await syncProductToAlgolia(product);
    console.log(`Synced product ${productId} to Algolia`);
  } catch (error) {
    console.error(`Failed to sync product ${productId}:`, error);
    throw error;
  }
}

/**
 * Sync multiple products to Algolia
 */
export async function syncProducts(productIds: string[]): Promise<void> {
  try {
    await connectDB();
    
    const products = await Product.find({ _id: { $in: productIds } })
      .populate('category', 'name slug')
      .populate('shop', 'shopName shopSlug logo isVerified location');

    await syncProductsToAlgolia(products);
  } catch (error) {
    console.error('Failed to sync products:', error);
    throw error;
  }
}

/**
 * Sync all active products
 * Use this for initial sync or full reindex
 */
export async function syncAllProducts(batchSize: number = 100): Promise<{ success: number; failed: number }> {
  try {
    await connectDB();
    
    // Clear existing index
    await clearAlgoliaIndex();
    
    let processed = 0;
    let failed = 0;
    let hasMore = true;

    while (hasMore) {
      const products = await Product.find({ status: 'active' })
        .populate('category', 'name slug')
        .populate('shop', 'shopName shopSlug logo isVerified location')
        .skip(processed)
        .limit(batchSize)
        .lean();

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      try {
        await syncProductsToAlgolia(products);
        processed += products.length;
      } catch (error) {
        console.error(`Failed to sync batch at offset ${processed}:`, error);
        failed += products.length;
      }
    }

    console.log(`Synced ${processed} products to Algolia (${failed} failed)`);
    return { success: processed, failed };
  } catch (error) {
    console.error('Failed to sync all products:', error);
    throw error;
  }
}

/**
 * Delete product from Algolia
 * Call this after product deletion
 */
export async function removeProduct(productId: string): Promise<void> {
  try {
    await deleteProductFromAlgolia(productId);
    console.log(`Removed product ${productId} from Algolia`);
  } catch (error) {
    console.error(`Failed to remove product ${productId}:`, error);
    throw error;
  }
}

/**
 * Setup Mongoose middleware for automatic sync
 * Call this once when the app starts
 */
export function setupProductSyncMiddleware(): void {
  // After saving a product
  Product.schema.post('save', async function(doc) {
    try {
      // Populate necessary fields before syncing
      const populated = await Product.findById(doc._id)
        .populate('category', 'name slug')
        .populate('shop', 'shopName shopSlug logo isVerified location');
      
      if (populated) {
        await syncProductToAlgolia(populated);
      }
    } catch (error) {
      console.error('Auto-sync error after save:', error);
    }
  });

  // After updating a product
  Product.schema.post('findOneAndUpdate', async function(doc) {
    if (doc) {
      try {
        const populated = await Product.findById(doc._id)
          .populate('category', 'name slug')
          .populate('shop', 'shopName shopSlug logo isVerified location');
        
        if (populated) {
          await syncProductToAlgolia(populated);
        }
      } catch (error) {
        console.error('Auto-sync error after update:', error);
      }
    }
  });

  // After deleting a product
  Product.schema.post('remove', async function(doc) {
    try {
      await deleteProductFromAlgolia(doc._id.toString());
    } catch (error) {
      console.error('Auto-sync error after remove:', error);
    }
  });

  Product.schema.post('findOneAndDelete', async function(doc) {
    if (doc) {
      try {
        await deleteProductFromAlgolia(doc._id.toString());
      } catch (error) {
        console.error('Auto-sync error after delete:', error);
      }
    }
  });

  console.log('Product sync middleware setup complete');
}

/**
 * Manual sync endpoint handler
 * For use in API routes or admin panel
 */
export async function handleManualSync(
  type: 'single' | 'all',
  productId?: string
): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    if (type === 'single' && productId) {
      await syncProduct(productId);
      return {
        success: true,
        message: `Product ${productId} synced successfully`,
      };
    } else if (type === 'all') {
      const result = await syncAllProducts();
      return {
        success: true,
        message: `Synced ${result.success} products (${result.failed} failed)`,
        details: result,
      };
    } else {
      return {
        success: false,
        message: 'Invalid sync type or missing product ID',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Sync failed',
    };
  }
}
