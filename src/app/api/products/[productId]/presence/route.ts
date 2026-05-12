import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import ProductViewPresence from "@/models/ProductViewPresence";

export const dynamic = "force-dynamic";

const STALE_MS = 45_000;

/** POST — heartbeat for “who is viewing”; no auth. Body: { viewerId: string } */
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ success: false, message: "Invalid product id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const viewerId = String(body?.viewerId || "").trim();
    if (!viewerId || viewerId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(viewerId)) {
      return NextResponse.json(
        { success: false, message: "viewerId must be 1–128 alphanumeric characters" },
        { status: 400 }
      );
    }

    await connectDB();
    const exists = await Product.exists({ _id: productId });
    if (!exists) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const now = new Date();
    const staleBefore = new Date(now.getTime() - STALE_MS);

    await ProductViewPresence.findOneAndUpdate(
      { product: productId, viewerId },
      { $set: { lastSeen: now } },
      { upsert: true, new: true }
    );

    const totalViewing = await ProductViewPresence.countDocuments({
      product: productId,
      lastSeen: { $gte: staleBefore },
    });

    if (Math.random() < 0.03) {
      void ProductViewPresence.deleteMany({
        lastSeen: { $lt: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: {
        totalViewing,
        /** Viewers other than this tab (same viewerId not double-counted across tabs if same id — tabs should use unique ids per tab or same id merges to one count) */
        othersApprox: Math.max(0, totalViewing - 1),
      },
    });
  } catch (error: any) {
    console.error("POST product presence error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Presence update failed" },
      { status: 500 }
    );
  }
}
