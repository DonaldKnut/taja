import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { generateShopNameAndTagline } from "@/lib/gemini";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/shop-suggestions
 * Suggest AI shop names & tagline from a rough idea
 */
export async function POST(request: NextRequest) {
  return requireAuth(async () => {
    try {
      const body = await request.json();
      const { idea, categories } = body as { idea?: string; categories?: string[] };

      const seed = (idea || "").trim();
      if (!seed && (!categories || !categories.length)) {
        return NextResponse.json(
          { success: false, message: "Provide at least a short idea or one category." },
          { status: 400 }
        );
      }

      const result = await generateShopNameAndTagline(seed, categories || []);

      // Expect generateShopNameAndTagline to return something like:
      // { names: string[], tagline: string }
      return NextResponse.json({
        success: true,
        names: result?.names || [],
        tagline: result?.tagline || "",
      });
    } catch (error: any) {
      console.error("AI shop suggestions error:", error);
      return NextResponse.json(
        { success: false, message: error?.message || "Failed to generate shop suggestions" },
        { status: 500 }
      );
    }
  })(request);
}

