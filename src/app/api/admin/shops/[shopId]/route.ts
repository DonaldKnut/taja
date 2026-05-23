import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import Product from '@/models/Product';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/shops/[shopId] - Ban/remove a shop (e.g. for defaulting). Admin only.
 * Sets shop status to 'banned' and suspends all products so they no longer appear.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();

      const shop = await Shop.findById(params.shopId);
      if (!shop) {
        return NextResponse.json(
          { success: false, message: 'Shop not found' },
          { status: 404 }
        );
      }

      if (shop.status === 'banned') {
        return NextResponse.json(
          { success: false, message: 'Shop is already banned' },
          { status: 400 }
        );
      }

      await shop.updateOne({ $set: { status: 'banned' } });
      await Product.updateMany(
        { shop: params.shopId },
        { $set: { status: 'suspended' } }
      );

      return NextResponse.json({
        success: true,
        message: 'Shop banned and its products suspended. It will no longer appear in the marketplace.',
        data: { shopId: params.shopId, status: 'banned' },
      });
    } catch (error: any) {
      console.error('Admin delete shop error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to ban shop' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * PUT /api/admin/shops/[shopId] - Suspend or activate a shop (admin only).
 * Body: { action: 'suspend' | 'activate' }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  return requireRole(['admin'])(async () => {
    try {
      const body = await request.json();
      const {
        action,
        shopName,
        description,
        about,
        tagline,
        logo,
        banner,
        avatar,
        coverImage,
        socialLinks,
        address,
        status,
        shopSlug
      } = body;

      await connectDB();

      const shop = await Shop.findById(params.shopId);
      if (!shop) {
        return NextResponse.json(
          { success: false, message: 'Shop not found' },
          { status: 404 }
        );
      }

      // Handle shopSlug updates with uniqueness check
      if (shopSlug && shopSlug !== shop.shopSlug) {
        const existingShop = await Shop.findOne({ shopSlug: shopSlug.toLowerCase().trim() });
        if (existingShop && existingShop._id.toString() !== params.shopId) {
          return NextResponse.json(
            { success: false, message: 'This shop link is already in use' },
            { status: 400 }
          );
        }
        shop.shopSlug = shopSlug.toLowerCase().trim();
        await shop.save();
      }

      // Handle status/action updates (suspend/activate)
      if (action || status) {
        const newStatus = action === 'suspend' ? 'suspended' : action === 'activate' ? 'active' : status;
        if (newStatus && ['active', 'suspended', 'banned', 'pending'].includes(newStatus)) {
          await shop.updateOne({ $set: { status: newStatus } });

          if (newStatus === 'suspended') {
            await Product.updateMany(
              { shop: params.shopId },
              { $set: { status: 'suspended' } }
            );
          } else if (newStatus === 'active') {
            await Product.updateMany(
              { shop: params.shopId, status: 'suspended' },
              { $set: { status: 'active' } }
            );
          }
        }
      }

      // Handle metadata updates
      const updateData: any = {};
      if (shopName) updateData.shopName = shopName.trim();
      if (description !== undefined) updateData.description = description;
      if (about !== undefined) updateData.about = about;
      if (tagline !== undefined) updateData.tagline = tagline;
      const prevLogo = (shop as any).logo;
      const prevAvatar = (shop as any).avatar;
      if (logo !== undefined) updateData.logo = logo;
      if (banner !== undefined) updateData.banner = banner;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (coverImage !== undefined) updateData.coverImage = coverImage;
      const logoChanged =
        logo !== undefined && (logo ?? '') !== (prevLogo ?? '');
      const avatarChanged =
        avatar !== undefined && (avatar ?? '') !== (prevAvatar ?? '');
      if (logoChanged || avatarChanged) {
        updateData.shopAvatarCustom = true;
      }
      if (socialLinks) updateData.socialLinks = socialLinks;
      if (address) updateData.address = address;

      if (Object.keys(updateData).length > 0) {
        await shop.updateOne({ $set: updateData });
      }

      const updatedShop = await Shop.findById(params.shopId).lean();

      return NextResponse.json({
        success: true,
        message: `Shop updated successfully`,
        data: updatedShop,
      });
    } catch (error: any) {
      console.error('Admin update shop error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update shop' },
        { status: 500 }
      );
    }
  })(request);
}
