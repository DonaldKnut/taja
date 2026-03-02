import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { slug: string };
}

/**
 * GET /api/blog/posts/:slug
 * Get single blog post by slug
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const post = await BlogPost.findOne({ 
      slug: params.slug,
      status: 'published',
    })
      .populate('author', 'fullName avatar bio')
      .populate('category', 'name slug color')
      .populate('relatedProducts', 'title slug price images rating');

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      );
    }

    // Increment view count
    post.metadata.views += 1;
    await post.save();

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    console.error('Get blog post error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/blog/posts/:slug
 * Update blog post (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return requireRole(['admin', 'editor'])(async (req, user) => {
    try {
      await connectDB();

      const body = await request.json();
      
      const post = await BlogPost.findOne({ slug: params.slug });

      if (!post) {
        return NextResponse.json(
          { success: false, message: 'Post not found' },
          { status: 404 }
        );
      }

      // Update fields
      Object.keys(body).forEach(key => {
        if (key !== '_id' && key !== 'createdAt') {
          (post as any)[key] = body[key];
        }
      });

      await post.save();

      // Populate for response
      const populatedPost = await BlogPost.findById(post._id)
        .populate('author', 'fullName avatar')
        .populate('category', 'name slug');

      return NextResponse.json({
        success: true,
        message: 'Blog post updated successfully',
        data: populatedPost,
      });
    } catch (error: any) {
      console.error('Update blog post error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update post' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * DELETE /api/blog/posts/:slug
 * Delete blog post (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return requireRole(['admin'])(async (req, user) => {
    try {
      await connectDB();

      const post = await BlogPost.findOneAndDelete({ slug: params.slug });

      if (!post) {
        return NextResponse.json(
          { success: false, message: 'Post not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Blog post deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete blog post error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to delete post' },
        { status: 500 }
      );
    }
  })(request);
}
