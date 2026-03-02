/**
 * Auto-Confirm Orders Job
 * 
 * Automatically confirms orders that have been in "shipped" status
 * for 7 days without buyer confirmation or dispute.
 * 
 * This should be run periodically (e.g., every hour) via:
 * - Vercel Cron Jobs
 * - AWS Lambda
 * - Node-cron (if self-hosted)
 * - GitHub Actions (scheduled)
 */

import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { releaseEscrowToSeller } from '@/lib/payments/escrow';
import { notifyOrderUpdate, notifyPaymentUpdate } from '@/lib/notifications';

const AUTO_CONFIRM_DAYS = 7;

/**
 * Process auto-confirmations for shipped orders
 */
export async function processAutoConfirmations() {
  try {
    await connectDB();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AUTO_CONFIRM_DAYS);

    // Find orders that:
    // 1. Are in "shipped" status
    // 2. Have delivery.shippedAt older than 7 days
    // 3. Haven't been confirmed or disputed yet
    const ordersToAutoConfirm = await Order.find({
      status: 'shipped',
      'delivery.shippedAt': { $lte: cutoffDate },
      $or: [
        { 'buyerConfirmation.status': { $exists: false } },
        { 'buyerConfirmation.status': 'pending' },
      ],
    }).populate('buyer', 'fullName email')
      .populate('seller', 'fullName email');

    console.log(`[AutoConfirm] Found ${ordersToAutoConfirm.length} orders to auto-confirm`);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const order of ordersToAutoConfirm) {
      try {
        // Update order
        order.status = 'completed';
        order.delivery.deliveredAt = new Date();
        order.delivery.autoConfirmAt = new Date();
        order.buyerConfirmation = {
          status: 'auto_confirmed',
          confirmedAt: new Date(),
        };

        await order.save();

        // Release escrow
        try {
          await releaseEscrowToSeller(order._id.toString());
          order.escrowStatus = 'released';
          await order.save();
        } catch (escrowError) {
          console.error(`[AutoConfirm] Failed to release escrow for order ${order.orderNumber}:`, escrowError);
          results.errors.push(`Escrow release failed for ${order.orderNumber}`);
        }

        // Notify seller
        await notifyPaymentUpdate(
          order.seller._id.toString(),
          order.orderNumber,
          'paid',
          order._id.toString()
        );

        // Notify buyer
        await notifyOrderUpdate(
          order.buyer._id.toString(),
          order.orderNumber,
          'completed',
          order._id.toString()
        );

        results.succeeded++;
        console.log(`[AutoConfirm] Auto-confirmed order ${order.orderNumber}`);
      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to process order ${order.orderNumber}: ${error}`;
        results.errors.push(errorMsg);
        console.error(`[AutoConfirm] ${errorMsg}`);
      }
    }

    results.processed = ordersToAutoConfirm.length;
    
    console.log('[AutoConfirm] Job completed:', results);
    return results;
  } catch (error) {
    console.error('[AutoConfirm] Job failed:', error);
    throw error;
  }
}

/**
 * Set auto-confirm date when order is shipped
 * Call this when seller uploads tracking
 */
export function calculateAutoConfirmDate(shippedAt: Date): Date {
  const autoConfirmAt = new Date(shippedAt);
  autoConfirmAt.setDate(autoConfirmAt.getDate() + AUTO_CONFIRM_DAYS);
  return autoConfirmAt;
}

/**
 * API Route Handler for Vercel Cron
 * Can be called via GET /api/cron/auto-confirm
 */
export async function autoConfirmHandler() {
  try {
    const results = await processAutoConfirmations();
    return {
      success: true,
      message: `Processed ${results.processed} orders`,
      results,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Job failed',
    };
  }
}

// If running directly (for testing or standalone execution)
if (require.main === module) {
  processAutoConfirmations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
