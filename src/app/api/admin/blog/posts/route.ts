import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { requireRole } from "@/lib/middleware";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/blog/posts
 * List all posts (draft, published, archived) for admin console.
 */
export async function GET(request: NextRequest) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
      const status = searchParams.get("status");
      const skip = (page - 1) * limit;

      const query: Record<string, unknown> = {};
      if (status && status !== "all") {
        query.status = status;
      }

      const [posts, total] = await Promise.all([
        BlogPost.find(query)
          .populate("author", "fullName email avatar")
          .populate("category", "name slug color")
          .select("-content")
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        BlogPost.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          posts,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 1,
          },
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to list posts";
      console.error("Admin blog list error:", error);
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  })(request);
}
