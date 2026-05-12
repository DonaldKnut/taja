import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LogisticsPartner from "@/models/LogisticsPartner";
import User from "@/models/User";
import { requireAuth } from "@/lib/middleware";
import { notifyAdminsLogisticsGuarantorSubmitted } from "@/lib/logisticsAdminNotify";

export const dynamic = "force-dynamic";

type AllowedIdType = "national_id" | "drivers_license" | "passport" | "voters_card";

function sanitize(input: unknown, max = 120) {
  return String(input || "").trim().slice(0, max);
}

function hasInvalidTagChars(value: string) {
  return /[<>]/.test(value);
}

// POST /api/logistics/guarantor - submit guarantor form after verification
export async function POST(request: NextRequest) {
  return requireAuth(async (_req, user) => {
    try {
      await connectDB();
      const body = await request.json();
      const fullName = sanitize(body?.fullName, 120);
      const phone = sanitize(body?.phone, 40);
      const relationship = sanitize(body?.relationship, 80);
      const address = sanitize(body?.address, 200);
      const idType = sanitize(body?.idType, 40) as AllowedIdType;
      const idNumber = sanitize(body?.idNumber, 60);
      const idFrontImage = sanitize(body?.idFrontImage, 500);
      const selfieImage = sanitize(body?.selfieImage, 500);

      const allowedIdTypes: AllowedIdType[] = [
        "national_id",
        "drivers_license",
        "passport",
        "voters_card",
      ];
      if (
        !fullName ||
        !phone ||
        !relationship ||
        !address ||
        !allowedIdTypes.includes(idType) ||
        !idFrontImage ||
        !selfieImage
      ) {
        return NextResponse.json(
          { success: false, message: "Complete all required guarantor fields" },
          { status: 400 }
        );
      }

      const fieldsToCheck = [fullName, phone, relationship, address, idNumber];
      if (fieldsToCheck.some(hasInvalidTagChars)) {
        return NextResponse.json(
          { success: false, message: "Invalid characters in guarantor form" },
          { status: 400 }
        );
      }

      const currentUser = await User.findById(user.userId).select("email").lean();
      const query: Record<string, any> = { $or: [{ user: user.userId }] };
      if (currentUser?.email) {
        query.$or.push({ email: String(currentUser.email).toLowerCase() });
      }

      const profile = await LogisticsPartner.findOne(query);
      if (!profile) {
        return NextResponse.json(
          { success: false, message: "Logistics profile not found" },
          { status: 404 }
        );
      }
      if (profile.status !== "approved" || profile.trust?.kycStatus !== "verified") {
        return NextResponse.json(
          { success: false, message: "Profile must be approved and KYC-verified first" },
          { status: 403 }
        );
      }

      const idNumberMasked = idNumber ? `****${idNumber.slice(-4)}` : undefined;

      profile.set({
        "trust.guarantorFormStatus": "submitted",
        "trust.guarantorForm": {
          fullName,
          phone,
          relationship,
          address,
          idType,
          idNumberMasked,
          idFrontImage,
          selfieImage,
          submittedAt: new Date(),
          reviewedAt: undefined,
          reviewedBy: undefined,
          reviewNotes: undefined,
        },
      });
      await profile.save();

      void notifyAdminsLogisticsGuarantorSubmitted({
        partnerId: String(profile._id),
        partnerName: profile.fullName || "Partner",
        guarantorName: fullName,
      });

      return NextResponse.json({
        success: true,
        message: "Guarantor form submitted for admin review",
      });
    } catch (error: any) {
      console.error("POST logistics guarantor error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to submit guarantor form" },
        { status: 500 }
      );
    }
  })(request);
}
