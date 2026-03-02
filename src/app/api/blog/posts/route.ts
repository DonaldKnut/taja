import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import { requireAuth, requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/blog/posts
 * List blog posts (public - only published)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const author = searchParams.get('author');

    const query: any = { status: 'published' };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (author) {
      query.author = author;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .populate('author', 'fullName avatar')
        .populate('category', 'name slug color')
        .select('-content') // Exclude full content for list view
        .sort({ publishedAt: -1 })
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
          pages: Math.ceil(total / limit),
          total,
          limit,
        },
      },
    });
  } catch (error: any) {
    console.error('Get blog posts error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blog/posts
 * Create new blog post (admin only)
 */
export async function POST(request: NextRequest) {
  return requireRole(['admin', 'editor'])(async (req, user) => {
    try {
      await connectDB();

      const body = await request.json();
      
      // Validate required fields
      if (!body.title || !body.content || !body.category) {
        return NextResponse.json(
          { success: false, message: 'Title, content, and category are required' },
          { status: 400 }
        );
      }

      // Generate excerpt if not provided
      if (!body.excerpt) {
        body.excerpt = body.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
      }

      const post = await BlogPost.create({
        ...body,
        author: user.userId,
      });

      // Populate for response
      const populatedPost = await BlogPost.findById(post._id)
        .populate('author', 'fullName avatar')
        .populate('category', 'name slug');

      return NextResponse.json({
        success: true,
        message: 'Blog post created successfully',
        data: populatedPost,
      }, { status: 201 });
    } catch (error: any) {
      console.error('Create blog post error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to create post' },
        { status: 500 }
      );
    }
  })(request);
}
