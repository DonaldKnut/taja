import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import ShopFollow from '@/models/ShopFollow';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// POST /api/shops/:shopId/follow - Follow a shop
export async function POST(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const shop = await Shop.findById(params.shopId);
      if (!shop) {
        return NextResponse.json(
          { success: false, message: 'Shop not found' },
          { status: 404 }
        );
      }

      // Check if already following
      const existingFollow = await ShopFollow.findOne({
        user: user.userId,
        shop: params.shopId,
      });

      if (existingFollow) {
        return NextResponse.json(
          { success: false, message: 'Already following this shop' },
          { status: 400 }
        );
      }

      // Create follow relationship
      await ShopFollow.create({
        user: user.userId,
        shop: params.shopId,
      });

      // Update shop follower count
      await Shop.findByIdAndUpdate(params.shopId, {
        $inc: { 'stats.followerCount': 1 },
      });

      return NextResponse.json({
        success: true,
        message: 'Shop followed successfully',
      });
    } catch (error: any) {
      console.error('Follow shop error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to follow shop' },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/shops/:shopId/follow - Unfollow a shop
export async function DELETE(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const follow = await ShopFollow.findOneAndDelete({
        user: user.userId,
        shop: params.shopId,
      });

      if (!follow) {
        return NextResponse.json(
          { success: false, message: 'Not following this shop' },
          { status: 400 }
        );
      }

      // Update shop follower count
      await Shop.findByIdAndUpdate(params.shopId, {
        $inc: { 'stats.followerCount': -1 },
      });

      return NextResponse.json({
        success: true,
        message: 'Shop unfollowed successfully',
      });
    } catch (error: any) {
      console.error('Unfollow shop error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to unfollow shop' },
        { status: 500 }
      );
    }
  })(request);
}

// GET /api/shops/:shopId/follow - Check if user is following
export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const follow = await ShopFollow.findOne({
        user: user.userId,
        shop: params.shopId,
      });

      return NextResponse.json({
        success: true,
        data: {
          isFollowing: !!follow,
        },
      });
    } catch (error: any) {
      console.error('Check follow status error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to check follow status' },
        { status: 500 }
      );
    }
  })(request);
}








