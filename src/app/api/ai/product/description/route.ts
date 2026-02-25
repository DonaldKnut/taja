import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";

// Lightweight, non-external \"AI\" helper to generate a nicer description
function buildHeuristicDescription(params: {
  title: string;
  description?: string;
  category?: string;
}) {
  const title = params.title.trim();
  const category = params.category?.trim();
  const existing = params.description?.trim();

  const sentences: string[] = [];

  // Intro
  sentences.push(
    `Introducing ${title}${
      category ? ` — a must‑have ${category.toLowerCase()}` : ""
    }.`
  );

  sentences.push(
    `Perfect for shoppers in Nigeria who want quality, value and convenience without stress.`
  );

  if (existing && existing.length > 12) {
    sentences.push(
      `Here’s a quick overview in simple language so buyers understand it at a glance.`
    );
  }

  // Simple body
  sentences.push(
    `This item is designed to be durable, easy to use and suitable for everyday life — from work to hangouts, deliveries and more.`
  );

  if (category?.toLowerCase().includes("cloth") || category?.toLowerCase().includes("fashion")) {
    sentences.push(
      `The fit is comfortable, easy to style and pairs well with different outfits so you can dress it up or down.`
    );
  }

  // Features list
  const features: string[] = [
    "Durable build made for daily Nigerian use",
    "Clean, modern look that works for different occasions",
    "Good value for money compared to similar items",
    "Easy to maintain and keep looking fresh",
  ];

  const lines: string[] = [];
  lines.push(sentences.join(" "));
  lines.push("");
  lines.push("Key features:");
  for (const feat of features) {
    lines.push(`- ${feat}`);
  }

  if (existing) {
    lines.push("");
    lines.push("Extra details from the seller:");
    lines.push(existing);
  }

  return lines.join("\n");
}

// POST /api/ai/product/description - Generate product description
// NOTE: This implementation does NOT call external AI for now.
// It builds a smart template description locally so the button still feels useful
// even without a working Gemini model.
export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const body = await req.json();
      const { title, description, category } = body || {};

      if (!title || typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: "Product title is required" },
          { status: 400 }
        );
      }

      const generatedDescription = buildHeuristicDescription({
        title,
        description,
        category,
      });

      return NextResponse.json({
        success: true,
        data: {
          description: generatedDescription,
        },
      });
    } catch (error: any) {
      console.error("Generate description error (local heuristic):", error);

      return NextResponse.json(
        {
          success: false,
          message:
            error?.message ||
            "Failed to generate description. Please try again in a moment.",
        },
        { status: 500 }
      );
    }
  })(request);
}






