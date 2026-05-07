import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LogisticsPartner from "@/models/LogisticsPartner";
import { authenticate } from "@/lib/middleware";

export const dynamic = "force-dynamic";

// POST /api/logistics/apply - soft-KYC logistics onboarding
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      vehicleType,
      canHandleFragile = false,
      state,
      city,
      areas = "",
      activeHours = "",
      idType,
      idNumber,
      selfieImage,
      idFrontImage,
      guarantorPhone,
      notes = "",
    } = body || {};

    if (!fullName || !email || !phone || !vehicleType || !state || !city) {
      return NextResponse.json(
        { success: false, message: "Full name, email, phone, vehicle type, state and city are required" },
        { status: 400 }
      );
    }
    if (!selfieImage || !idFrontImage) {
      return NextResponse.json(
        { success: false, message: "Selfie and ID front image are required for soft KYC" },
        { status: 400 }
      );
    }

    const allowedVehicles = ["bicycle", "motorcycle", "car", "van", "truck"];
    if (!allowedVehicles.includes(String(vehicleType))) {
      return NextResponse.json({ success: false, message: "Invalid vehicle type" }, { status: 400 });
    }

    const auth = await authenticate(request);
    const linkedUserId = auth.user?.userId;

    const areaList = String(areas)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    const maskedId = idNumber
      ? `****${String(idNumber).slice(-4)}`
      : undefined;
    const payoutHoldDays = 14;
    const payoutHoldUntil = new Date(Date.now() + payoutHoldDays * 24 * 60 * 60 * 1000);

    const doc = await LogisticsPartner.findOneAndUpdate(
      { email: String(email).toLowerCase(), phone: String(phone).trim() },
      {
        $set: {
          user: linkedUserId || undefined,
          fullName: String(fullName).trim(),
          email: String(email).toLowerCase().trim(),
          phone: String(phone).trim(),
          vehicleType: String(vehicleType),
          canHandleFragile: Boolean(canHandleFragile),
          notes: String(notes || "").trim() || undefined,
          coverage: {
            state: String(state).trim(),
            city: String(city).trim(),
            areas: areaList,
          },
          availability: {
            isOnline: false,
            activeHours: String(activeHours || "").trim() || undefined,
          },
          trust: {
            kycStatus: "pending",
            idType: idType || undefined,
            idNumberMasked: maskedId,
            selfieImage: selfieImage ? String(selfieImage).trim() : undefined,
            idFrontImage: idFrontImage ? String(idFrontImage).trim() : undefined,
            guarantorPhone: guarantorPhone ? String(guarantorPhone).trim() : undefined,
          },
          risk: {
            level: "normal",
          },
          payout: {
            holdDays: payoutHoldDays,
            holdUntil: payoutHoldUntil,
          },
          status: "pending_review",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Application received. We will review and verify shortly.",
      data: doc,
    });
  } catch (error: any) {
    console.error("POST logistics apply error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit logistics application" },
      { status: 500 }
    );
  }
}
