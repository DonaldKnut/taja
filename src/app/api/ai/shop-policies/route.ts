import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { generateShopPolicies } from "@/lib/gemini";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/shop-policies
 * Generate AI shop policies (return/shipping) based on category and tone
 */
export async function POST(request: NextRequest) {
  return requireAuth(async () => {
    try {
      const body = await request.json();
      const { shopName, categories, policyType } = body as {
        shopName?: string;
        categories?: string[];
        policyType?: "returns" | "shipping";
      };

      if (!policyType) {
        return NextResponse.json(
          { success: false, message: "policyType is required (returns | shipping)" },
          { status: 400 }
        );
      }

      const text = await generateShopPolicies({
        shopName: (shopName || "").trim(),
        categories: categories || [],
        policyType,
      });

      return NextResponse.json({
        success: true,
        text,
      });
    } catch (error: any) {
      console.error("AI shop policies error:", error);
      return NextResponse.json(
        { success: false, message: error?.message || "Failed to generate shop policy" },
        { status: 500 }
      );
    }
  })(request);
}

