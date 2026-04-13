import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import User from '@/models/User';
import Category from '@/models/Category';
import { requireAuth } from '@/lib/middleware';
import { notifyAdminsNewShop } from '@/lib/notifications';
import { sendAdminNewShopEmail } from '@/lib/email';
import { sanitizeShopTaxProfile } from '@/lib/tax';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const normalizeCategoryName = (value: string) =>
  value.replace(/\s+/g, ' ').trim();

const normalizeCategoryKey = (value: string) =>
  normalizeCategoryName(value).toLowerCase();

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const toDisplayName = (value: string) =>
  normalizeCategoryName(value)
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const normalizeCategoryInput = (input: unknown): string[] => {
  if (!Array.isArray(input)) return [];
  const dedup = new Map<string, string>();
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const normalized = normalizeCategoryName(raw);
    if (!normalized) continue;
    const key = normalizeCategoryKey(normalized);
    if (!dedup.has(key)) {
      dedup.set(key, normalized);
    }
  }
  return Array.from(dedup.values());
};

const resolveCategoryCatalog = async (categories: string[]) => {
  if (categories.length === 0) {
    return { categories: [], categoryIds: [] as string[] };
  }

  const existing = await Category.find({
    $or: categories.map((name) => ({ name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } })),
  })
    .select('_id name')
    .lean();

  const byKey = new Map<string, { _id: string; name: string }>();
  for (const category of existing) {
    byKey.set(normalizeCategoryKey(category.name), {
      _id: category._id.toString(),
      name: normalizeCategoryName(category.name),
    });
  }

  const resolved: string[] = [];
  const resolvedIds: string[] = [];

  for (const rawName of categories) {
    const key = normalizeCategoryKey(rawName);
    let found = byKey.get(key);

    if (!found) {
      const displayName = toDisplayName(rawName);
      const baseSlug = toSlug(displayName) || `category-${Date.now()}`;
      const existingBySlug = await Category.findOne({ slug: baseSlug }).select('_id name').lean();

      if (existingBySlug) {
        found = {
          _id: existingBySlug._id.toString(),
          name: normalizeCategoryName(existingBySlug.name),
        };
      } else {
        try {
          const created = await Category.create({
            name: displayName,
            slug: baseSlug,
            isActive: true,
            sortOrder: 100,
          });
          found = {
            _id: created._id.toString(),
            name: normalizeCategoryName(created.name),
          };
        } catch (err: any) {
          // Handle possible duplicate slug race by reading it back.
          if (err?.code === 11000) {
            const fallback = await Category.findOne({ slug: baseSlug }).select('_id name').lean();
            if (fallback) {
              found = {
                _id: fallback._id.toString(),
                name: normalizeCategoryName(fallback.name),
              };
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }

      if (found) {
        byKey.set(key, found);
      }
    }

    if (found) {
      resolved.push(found.name);
      resolvedIds.push(found._id);
    } else {
      resolved.push(rawName);
    }
  }

  return { categories: resolved, categoryIds: resolvedIds };
};

// GET /api/shops - Get all shops
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const verified = searchParams.get('verified');

    const query: any = { status: 'active' };

    const andFilters: any[] = [];
    if (search) {
      andFilters.push({
        $or: [
          { shopName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (category) {
      andFilters.push({
        $or: [{ category }, { categories: category }],
      });
    }
    if (andFilters.length > 0) {
      query.$and = andFilters;
    }

    if (verified !== null) {
      query['verification.status'] = verified === 'true' ? 'verified' : { $ne: 'verified' };
    }

    const skip = (page - 1) * limit;

    const shops = await Shop.find(query)
      .populate('owner', 'fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Shop.countDocuments(query);

    // Calculate dynamic stats for each shop
    const Product = (await import('@/models/Product')).default;
    const ShopFollow = (await import('@/models/ShopFollow')).default;

    const shopsWithStats = await Promise.all(
      shops.map(async (shop) => {
        const [totalProducts, followerCount] = await Promise.all([
          Product.countDocuments({ shop: shop._id, status: { $ne: 'deleted' } }),
          ShopFollow.countDocuments({ shop: shop._id }),
        ]);

        return {
          ...shop,
          categories: (shop as any).categories && (shop as any).categories.length > 0
            ? (shop as any).categories
            : (shop as any).category
              ? [(shop as any).category]
              : [],
          categoryIds: ((shop as any).categoryIds || []).map((id: any) => id.toString()),
          stats: {
            ...shop.stats,
            totalProducts,
            followerCount,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        shops: shopsWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get shops error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch shops' },
      { status: 500 }
    );
  }
}

// POST /api/shops - Create shop
// Any authenticated user can create a shop; buyers become sellers when they do.
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const {
        shopName,
        description,
        about,
        tagline,
        category,
        categories: categoriesInput,
        shopSlug,
        logo,
        banner,
        avatar,
        coverImage,
        socialLinks,
        settings,
        policies,
        taxProfile,
      } = body;

      if (!shopName || !shopSlug) {
        return NextResponse.json(
          { success: false, message: 'Shop name and slug are required' },
          { status: 400 }
        );
      }

      await connectDB();

      // One shop per user: if they already have a shop (pending or active), block creation
      const existingShopByOwner = await Shop.findOne({ owner: user.userId });
      if (existingShopByOwner) {
        return NextResponse.json(
          {
            success: false,
            message: 'You can only set up one shop. Your shop is already registered and under review.',
            code: 'SHOP_ALREADY_EXISTS',
          },
          { status: 409 }
        );
      }

      // Check if slug is unique
      const existingShop = await Shop.findOne({ shopSlug: shopSlug.toLowerCase() });
      if (existingShop) {
        return NextResponse.json(
          { success: false, message: 'Shop slug already exists' },
          { status: 400 }
        );
      }

      // Check if user is already KYC approved to auto-activate the shop
      const isAutoApproved = user.kyc?.status === 'approved';
      const incomingCategories = normalizeCategoryInput(categoriesInput);
      if (incomingCategories.length === 0 && typeof category === 'string' && normalizeCategoryName(category)) {
        incomingCategories.push(normalizeCategoryName(category));
      }
      const resolvedCategories = await resolveCategoryCatalog(incomingCategories);
      const primaryCategory = resolvedCategories.categories[0] || (typeof category === 'string' ? normalizeCategoryName(category) : undefined);

      const bodyLogo = typeof logo === 'string' && logo.trim() ? logo.trim() : undefined;
      const bodyAvatar = typeof avatar === 'string' && avatar.trim() ? avatar.trim() : undefined;
      let effectiveLogo = bodyLogo;
      let effectiveAvatar = bodyAvatar || bodyLogo;
      if (!effectiveLogo && !effectiveAvatar) {
        const ownerUser = await User.findById(user.userId).select('avatar').lean();
        const a = ownerUser?.avatar;
        if (typeof a === 'string' && a.trim()) {
          effectiveLogo = a.trim();
          effectiveAvatar = a.trim();
        }
      }
      const shopAvatarCustom = Boolean(bodyLogo || bodyAvatar);
      const sanitizedTaxProfile = sanitizeShopTaxProfile(taxProfile);

      const shop = await Shop.create({
        owner: user.userId,
        shopName,
        shopSlug: shopSlug.toLowerCase(),
        description,
        about,
        tagline,
        category: primaryCategory,
        categories: resolvedCategories.categories,
        categoryIds: resolvedCategories.categoryIds,
        logo: effectiveLogo,
        banner,
        avatar: effectiveAvatar || effectiveLogo,
        coverImage: coverImage || banner,
        shopAvatarCustom,
        socialLinks,
        settings,
        policies,
        ...(sanitizedTaxProfile ? { taxProfile: sanitizedTaxProfile } : {}),
        verification: {
          status: isAutoApproved ? 'verified' : 'pending',
          verifiedAt: isAutoApproved ? new Date() : undefined,
        },
        status: isAutoApproved ? 'active' : 'pending',
      });

      // Link shop to user and promote buyer → seller when they create a shop
      const updatePayload: { shop: typeof shop._id; role?: string } = { shop: shop._id };
      if (user.role === 'buyer') {
        updatePayload.role = 'seller';
      }
      const updatedUser = await User.findByIdAndUpdate(
        user.userId,
        { $set: updatePayload },
        { new: true }
      ).select('fullName email');

      // Notify all admins (in-app notification + email)
      const ownerName = updatedUser?.fullName || 'Unknown';
      const ownerEmail = updatedUser?.email || user.email;
      try {
        await notifyAdminsNewShop({
          shopId: shop._id.toString(),
          shopName: shop.shopName,
          shopSlug: shop.shopSlug,
          ownerName,
          ownerEmail,
        });
        await sendAdminNewShopEmail(shop.shopName, ownerName, ownerEmail);
      } catch (notifyErr: any) {
        console.error('Failed to notify admins of new shop:', notifyErr);
        // Don't fail the request; shop is already created
      }

      await writeAuditLog({
        request,
        actorUserId: user.userId,
        actorRole: user.role,
        action: 'shop.create',
        entityType: 'shop',
        entityId: String(shop._id),
        metadata: {
          shopName: shop.shopName,
          shopSlug: shop.shopSlug,
          vatStatus: (shop as any).taxProfile?.vatStatus || 'unknown',
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Shop created successfully. It is now under review. You will not see the setup page again.',
          data: {
            ...shop.toObject(),
            categories: (shop as any).categories || (shop.category ? [shop.category] : []),
            categoryIds: ((shop as any).categoryIds || []).map((id: any) => id.toString()),
          },
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Create shop error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to create shop' },
        { status: 500 }
      );
    }
  })(request);
}

