import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";

// Simple local tag suggester – no external AI call
function buildHeuristicTags(params: {
  title: string;
  description?: string;
  category?: string;
  count: number;
}): string[] {
  const title = params.title.toLowerCase();
  const description = params.description?.toLowerCase() || "";
  const category = params.category?.toLowerCase() || "";
  const target = Math.min(Math.max(params.count || 10, 5), 20);

  const clean = (text: string) =>
    text
      .replace(/[^a-z0-9\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const words = [
    ...clean(title),
    ...clean(category),
    ...clean(description).slice(0, 10),
  ];

  const baseTags = [
    "taja",
    "taja shop",
    "online shopping",
    "nigeria",
    "marketplace",
  ];

  const all = [...words, ...baseTags];

  const unique: string[] = [];
  for (const w of all) {
    if (!w) continue;
    if (unique.includes(w)) continue;
    unique.push(w);
    if (unique.length >= target) break;
  }

  return unique;
}

// POST /api/ai/product/tags - Suggest product tags (local heuristic)
export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const body = await req.json();
      const { title, description, category, count = 10 } = body || {};

      if (!title || typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: "Product title is required" },
          { status: 400 }
        );
      }

      const tags = buildHeuristicTags({
        title,
        description,
        category,
        count,
      });

      return NextResponse.json({
        success: true,
        data: {
          tags,
        },
      });
    } catch (error: any) {
      console.error("Suggest tags error (local heuristic):", error);

      return NextResponse.json(
        {
          success: false,
          message:
            error?.message ||
            "Failed to suggest tags. Please try again in a moment.",
        },
        { status: 500 }
      );
    }
  })(request);
}






