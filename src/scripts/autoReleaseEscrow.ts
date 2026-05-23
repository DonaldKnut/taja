/**
 * Escrow Auto-Release Script
 *
 * Runs through delivered orders with funded escrow and releases funds
 * to sellers after a configured number of days.
 *
 * Run manually with:
 *   npx tsx src/scripts/autoReleaseEscrow.ts
 *
 * In production, schedule this script daily (e.g. with cron or your host's scheduler).
 */

import dotenv from "dotenv";
import path from "path";

// Load env (same pattern as seedDatabase)
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import PlatformSettings from "@/models/PlatformSettings";
import { autoReleaseEscrowAfterPeriod } from "@/lib/payments/escrow";

async function getAutoReleaseDays(): Promise<number> {
  const envDays = parseInt(process.env.ESCROW_AUTO_RELEASE_DAYS || "7", 10);
  try {
    await connectDB();
    const doc = await PlatformSettings.findOne().lean();
    const fromSettings = (doc as any)?.payments?.autoReleaseDays;
    if (typeof fromSettings === "number" && fromSettings > 0 && fromSettings <= 60) {
      return fromSettings;
    }
  } catch (e) {
    console.error("Error loading autoReleaseDays from PlatformSettings, falling back to env/default:", e);
  }
  return Number.isFinite(envDays) && envDays > 0 ? envDays : 7;
}

async function run() {
  try {
    const days = await getAutoReleaseDays();
    await connectDB();

    console.log(`🔎 Scanning for orders eligible for auto-release (>= ${days} days since deliveredAt)...`);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const candidates = await Order.find({
      escrowStatus: "funded",
      status: { $in: ["delivered", "completed"] },
      "delivery.deliveredAt": { $lte: cutoff },
    })
      .select("_id delivery.deliveredAt escrowStatus")
      .lean();

    console.log(`Found ${candidates.length} funded orders potentially eligible for release.`);

    for (const order of candidates) {
      try {
        const released = await autoReleaseEscrowAfterPeriod(order._id.toString(), days);
        if (released) {
          console.log(`✅ Auto-released escrow for order ${order._id}`);
        } else {
          console.log(`⏭️ Skipped order ${order._id} (not yet eligible or already handled).`);
        }
      } catch (e: any) {
        console.error(`❌ Failed to auto-release escrow for order ${order._id}:`, e?.message || e);
      }
    }
  } catch (e: any) {
    console.error("Fatal error in autoReleaseEscrow script:", e?.message || e);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();

