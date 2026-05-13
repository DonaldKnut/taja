import { createHash } from "crypto";
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import ProductViewEvent from "@/models/ProductViewEvent";

function viewerIpSalt() {
  return process.env.PRODUCT_VIEW_IP_SALT || "taja_product_views_v1";
}

export function hashProductViewerIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const ip =
    forwardedFor.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return createHash("sha256")
    .update(`${viewerIpSalt()}:${ip}`)
    .digest("hex")
    .slice(0, 40);
}

/** Fire-and-forget telemetry row (TTL on collection). Skip for owner previews. */
export function recordProductViewTelemetry(input: {
  productId: string;
  userId: string | null;
  ipHash: string;
}): void {
  const { productId, userId, ipHash } = input;
  if (!mongoose.Types.ObjectId.isValid(productId) || !ipHash) return;
  void ProductViewEvent.create({
    product: productId,
    recordedAt: new Date(),
    userId: userId || null,
    ipHash,
  }).catch(() => {});
}

export async function getProductViewAnalytics(productId: string, days: number) {
  const safeDays = Math.min(Math.max(Math.floor(days || 7), 1), 90);
  const since = new Date(Date.now() - safeDays * 86400000);
  const oid = new mongoose.Types.ObjectId(productId);

  const [facet] = await ProductViewEvent.aggregate<{
    totals: Array<{ hits: number; uniqueIps: number; uniqueLoggedIn: number }>;
    byDay: Array<{ date: string; rawHits: number; uniqueIp: number; uniqueLoggedIn: number }>;
  }>([
    { $match: { product: oid, recordedAt: { $gte: since } } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              hits: { $sum: 1 },
              ips: { $addToSet: "$ipHash" },
              userIds: { $addToSet: "$userId" },
            },
          },
          {
            $project: {
              _id: 0,
              hits: 1,
              uniqueIps: { $size: "$ips" },
              uniqueLoggedIn: {
                $size: {
                  $filter: {
                    input: "$userIds",
                    as: "u",
                    cond: {
                      $and: [{ $ne: ["$$u", null] }, { $ne: ["$$u", ""] }],
                    },
                  },
                },
              },
            },
          },
        ],
        byDay: [
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$recordedAt", timezone: "UTC" },
              },
              rawHits: { $sum: 1 },
              ips: { $addToSet: "$ipHash" },
              userIds: { $addToSet: "$userId" },
            },
          },
          {
            $project: {
              _id: 0,
              date: "$_id",
              rawHits: 1,
              uniqueIp: { $size: "$ips" },
              uniqueLoggedIn: {
                $size: {
                  $filter: {
                    input: "$userIds",
                    as: "u",
                    cond: {
                      $and: [{ $ne: ["$$u", null] }, { $ne: ["$$u", ""] }],
                    },
                  },
                },
              },
            },
          },
          { $sort: { date: 1 } },
        ],
      },
    },
  ]);

  const t = facet?.totals?.[0];
  return {
    days: safeDays,
    since: since.toISOString(),
    totals: {
      rawHits: t?.hits ?? 0,
      uniqueIpApprox: t?.uniqueIps ?? 0,
      uniqueLoggedInApprox: t?.uniqueLoggedIn ?? 0,
    },
    byDay: facet?.byDay ?? [],
  };
}
