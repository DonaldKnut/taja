import connectDB from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import BlogCategory from "@/models/BlogCategory";
import "@/models/User";
import "@/models/Product";

export type BlogPostListItem = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  publishedAt?: Date;
  tags: string[];
  isFeatured?: boolean;
  metadata: { readingTime: number; views: number };
  author?: { fullName?: string; avatar?: string } | null;
  category?: { name: string; slug: string; color?: string } | null;
};

export async function getBlogCategories() {
  await connectDB();
  return BlogCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function getPublishedPosts(options: {
  page?: number;
  limit?: number;
  categoryId?: string;
  featuredOnly?: boolean;
}) {
  await connectDB();
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(48, Math.max(1, options.limit ?? 12));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { status: "published" };
  if (options.categoryId) query.category = options.categoryId;
  if (options.featuredOnly) query.isFeatured = true;

  const [posts, total] = await Promise.all([
    BlogPost.find(query)
      .populate("author", "fullName avatar")
      .populate("category", "name slug color")
      .select("-content")
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments(query),
  ]);

  return {
    posts: posts as unknown as BlogPostListItem[],
    pagination: { page, pageSize: limit, total, pages: Math.ceil(total / limit) || 1 },
  };
}

export async function getFeaturedPost() {
  await connectDB();
  const post = await BlogPost.findOne({ status: "published", isFeatured: true })
    .populate("author", "fullName avatar")
    .populate("category", "name slug color")
    .select("-content")
    .sort({ publishedAt: -1 })
    .lean();

  return post as BlogPostListItem | null;
}

export async function getPublishedPostBySlug(slug: string) {
  await connectDB();
  const post = await BlogPost.findOne({ slug, status: "published" })
    .populate("author", "fullName avatar")
    .populate("category", "name slug color")
    .populate({
      path: "relatedProducts",
      select: "title slug price images averageRating reviewCount",
      match: { status: "active" },
    })
    .lean();

  return post;
}

export async function recordPostView(postId: string) {
  await connectDB();
  await BlogPost.updateOne({ _id: postId }, { $inc: { "metadata.views": 1 } });
}

/** Slugs + dates for sitemap.xml (published posts only) */
export async function getPublishedBlogEntriesForSitemap() {
  await connectDB();
  const posts = await BlogPost.find({ status: "published" })
    .select("slug updatedAt publishedAt")
    .lean();
  return posts.map((p) => ({
    slug: p.slug as string,
    lastModified: (p as { updatedAt?: Date; publishedAt?: Date }).updatedAt
      || (p as { publishedAt?: Date }).publishedAt
      || new Date(),
  }));
}
