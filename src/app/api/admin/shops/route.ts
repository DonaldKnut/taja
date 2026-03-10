import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import User from '@/models/User';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/shops - List all shops (admin only). Used for dropdowns e.g. when admin adds a product.
 */
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();
      const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '500'), 500);
      const shops = await Shop.find({})
        .populate('owner', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return NextResponse.json({
        success: true,
        data: shops.map((s: any) => ({
          _id: s._id,
          shopName: s.shopName,
          shopSlug: s.shopSlug,
          status: s.status,
          owner: s.owner,
        })),
      });
    } catch (error: any) {
      console.error('GET admin shops error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch shops' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * POST /api/admin/shops - Create a shop as admin (e.g. platform shop or to help onboard store owners).
 * Admin-owned shop is created active and verified immediately.
 */
export async function POST(request: NextRequest) {
  return requireRole(['admin'])(async (req, user) => {
    try {
      const body = await request.json();
      const {
        shopName,
        shopSlug,
        description,
        about,
        tagline,
        logo,
        banner,
        avatar,
        coverImage,
        address,
        socialLinks,
        settings,
        ownerId,
      } = body;

      if (!shopName || !shopSlug) {
        return NextResponse.json(
          { success: false, message: 'Shop name and slug are required' },
          { status: 400 }
        );
      }

      await connectDB();

      let ownerObjectId = user.userId;
      if (ownerId && typeof ownerId === 'string') {
        const ownerDoc = await User.findById(ownerId).select('_id').lean();
        if (!ownerDoc) {
          return NextResponse.json(
            { success: false, message: 'Selected owner user not found' },
            { status: 400 }
          );
        }
        ownerObjectId = ownerDoc._id;
      }

      const slug = shopSlug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (!slug) {
        return NextResponse.json(
          { success: false, message: 'Shop slug must contain at least one letter or number' },
          { status: 400 }
        );
      }

      const existingShop = await Shop.findOne({ shopSlug: slug });
      if (existingShop) {
        return NextResponse.json(
          { success: false, message: 'A shop with this slug already exists' },
          { status: 400 }
        );
      }

      const cleanSocial = socialLinks && typeof socialLinks === 'object' ? {
        instagram: socialLinks.instagram?.trim() || undefined,
        tiktok: socialLinks.tiktok?.trim() || undefined,
        whatsapp: socialLinks.whatsapp?.trim() || undefined,
        twitter: socialLinks.twitter?.trim() || undefined,
        facebook: socialLinks.facebook?.trim() || undefined,
        website: socialLinks.website?.trim() || undefined,
        youtube: socialLinks.youtube?.trim() || undefined,
        linkedin: socialLinks.linkedin?.trim() || undefined,
      } : undefined;

      const shop = await Shop.create({
        owner: ownerObjectId,
        shopName: shopName.trim(),
        shopSlug: slug,
        description: description?.trim() || undefined,
        about: about?.trim() || undefined,
        tagline: tagline?.trim() || undefined,
        logo: logo?.trim() || undefined,
        banner: banner?.trim() || undefined,
        avatar: (avatar?.trim() || logo?.trim()) || undefined,
        coverImage: (coverImage?.trim() || banner?.trim()) || undefined,
        address: address && typeof address === 'object' && address.addressLine1
          ? {
              addressLine1: address.addressLine1.trim(),
              addressLine2: address.addressLine2?.trim(),
              city: (address.city || 'Lagos').trim(),
              state: (address.state || 'Lagos').trim(),
              postalCode: address.postalCode?.trim(),
              country: (address.country || 'Nigeria').trim(),
            }
          : {
              addressLine1: 'Platform',
              city: 'Lagos',
              state: 'Lagos',
              country: 'Nigeria',
            },
        socialLinks: cleanSocial,
        settings: settings && typeof settings === 'object' ? {
          responseTime: settings.responseTime?.trim(),
          returnPolicy: settings.returnPolicy?.trim(),
          defaultDeliveryFee: settings.defaultDeliveryFee != null ? Number(settings.defaultDeliveryFee) : undefined,
        } : undefined,
        verification: {
          status: 'verified',
          verifiedAt: new Date(),
          verifiedBy: user.userId,
        },
        status: 'active',
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Shop created successfully. You can add products to it from Admin → Products.',
          data: shop,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('POST admin shops error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to create shop' },
        { status: 500 }
      );
    }
  })(request);
}
