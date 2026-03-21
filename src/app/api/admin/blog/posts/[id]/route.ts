import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { requireRole } from "@/lib/middleware";

export const dynamic = "force-dynamic";

type RouteParams = { params: { id: string } };

/**
 * GET /api/admin/blog/posts/:id
 * Full post for editor (includes drafts).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return requireRole(["admin"])(async () => {
    try {
      if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
      }

      await connectDB();

      const post = await BlogPost.findById(params.id)
        .populate("author", "fullName email avatar")
        .populate("category", "name slug color")
        .populate({
          path: "relatedProducts",
          select: "title slug price images",
        })
        .lean();

      if (!post) {
        return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: post });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch post";
      console.error("Admin blog get error:", error);
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  })(request);
}

const ALLOWED_UPDATE = [
  "title",
  "slug",
  "excerpt",
  "content",
  "category",
  "tags",
  "featuredImage",
  "images",
  "status",
  "isFeatured",
  "publishedAt",
  "seo",
  "relatedProducts",
  "allowComments",
] as const;

/**
 * PUT /api/admin/blog/posts/:id
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return requireRole(["admin"])(async () => {
    try {
      if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
      }

      await connectDB();

      const post = await BlogPost.findById(params.id);
      if (!post) {
        return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
      }

      const body = await request.json();

      for (const key of ALLOWED_UPDATE) {
        if (body[key] === undefined) continue;
        if (key === "relatedProducts" && Array.isArray(body.relatedProducts)) {
          (post as unknown as Record<string, unknown>).relatedProducts = body.relatedProducts
            .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
            .map((id: string) => new mongoose.Types.ObjectId(id));
          continue;
        }
        (post as unknown as Record<string, unknown>)[key] = body[key];
      }

      if (!body.excerpt && body.content) {
        post.excerpt =
          String(body.content)
            .replace(/<[^>]*>/g, "")
            .substring(0, 280)
            .trim() + (String(body.content).replace(/<[^>]*>/g, "").length > 280 ? "…" : "");
      }

      await post.save();

      const populated = await BlogPost.findById(post._id)
        .populate("author", "fullName email avatar")
        .populate("category", "name slug color")
        .lean();

      return NextResponse.json({
        success: true,
        message: "Post updated",
        data: populated,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update post";
      console.error("Admin blog update error:", error);
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  })(request);
}

/**
 * DELETE /api/admin/blog/posts/:id
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return requireRole(["admin"])(async () => {
    try {
      if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
      }

      await connectDB();

      const deleted = await BlogPost.findByIdAndDelete(params.id);
      if (!deleted) {
        return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Post deleted" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete post";
      console.error("Admin blog delete error:", error);
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  })(request);
}
