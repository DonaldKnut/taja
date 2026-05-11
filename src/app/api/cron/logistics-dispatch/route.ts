import { NextRequest, NextResponse } from "next/server";
import { processExpiredDeliveryClaims } from "@/lib/jobs/deliveryJobs";

export const dynamic = "force-dynamic";

// GET/POST /api/cron/logistics-dispatch - requeue timed-out claims and close expired open jobs
async function run(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log("[Cron] logistics-dispatch triggered without valid auth");
    }

    const result = await processExpiredDeliveryClaims();
    return NextResponse.json({
      success: true,
      message: "Logistics dispatch cron completed",
      data: result,
    });
  } catch (error: any) {
    console.error("[Cron] logistics-dispatch failed:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Logistics dispatch cron failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
