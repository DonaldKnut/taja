import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import Category from '@/models/Category';
import { requireAuth } from '@/lib/middleware';

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
    if (!dedup.has(key)) dedup.set(key, normalized);
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

// GET /api/shops/:shopId - Get shop by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    await connectDB();

    const shop = await Shop.findById(params.shopId)
      .populate('owner', 'fullName avatar email')
      .lean();

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Shop not found' },
        { status: 404 }
      );
    }

    // Calculate dynamic stats
    const Product = (await import('@/models/Product')).default;
    const Order = (await import('@/models/Order')).default;
    const Review = (await import('@/models/Review')).default;
    const ShopFollow = (await import('@/models/ShopFollow')).default;

    const [totalProducts, totalOrders, reviews, followerCount] = await Promise.all([
      Product.countDocuments({ shop: params.shopId, status: { $ne: 'deleted' } }),
      Order.countDocuments({ shop: params.shopId }),
      Review.aggregate([
        { $match: { shop: shop._id } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ]),
      ShopFollow.countDocuments({ shop: params.shopId }),
    ]);

    const reviewData = reviews[0] || { averageRating: 0, reviewCount: 0 };

    // Update shop with dynamic stats
    const updatedShop = {
      ...shop,
      categories: (shop as any).categories && (shop as any).categories.length > 0
        ? (shop as any).categories
        : (shop as any).category
          ? [(shop as any).category]
          : [],
      categoryIds: ((shop as any).categoryIds || []).map((id: any) => id.toString()),
      // Normalise avatar / cover fields for the frontend
      avatar: (shop as any).avatar || shop.logo,
      coverImage: (shop as any).coverImage || shop.banner,
      stats: {
        ...shop.stats,
        totalProducts,
        totalOrders,
        averageRating: Math.round(reviewData.averageRating * 10) / 10,
        reviewCount: reviewData.reviewCount,
        followerCount,
      },
    };

    return NextResponse.json({
      success: true,
      data: updatedShop,
    });
  } catch (error: any) {
    console.error('Get shop error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch shop' },
      { status: 500 }
    );
  }
}

// PUT /api/shops/:shopId - Update shop
export async function PUT(
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

      // Check if user owns the shop or is admin
      if (shop.owner.toString() !== user.userId && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const {
        shopName,
        shopSlug,
        description,
        about,
        tagline,
        category,
        categories: categoriesInput,
        logo,
        banner,
        avatar,
        coverImage,
        address,
        socialLinks,
        settings,
        policies,
      } = body;

      if (shopSlug && shopSlug !== shop.shopSlug) {
        if (user.role !== 'admin') {
          return NextResponse.json(
            { success: false, message: 'Only admins can change the shop link' },
            { status: 403 }
          );
        }

        // Check if slug is already taken
        const existingShop = await Shop.findOne({ shopSlug: shopSlug.toLowerCase().trim() });
        if (existingShop && existingShop._id.toString() !== params.shopId) {
          return NextResponse.json(
            { success: false, message: 'This shop link is already in use' },
            { status: 400 }
          );
        }
        shop.shopSlug = shopSlug.toLowerCase().trim();
      }

      if (shopName) shop.shopName = shopName;
      if (description !== undefined) shop.description = description;
      if (about !== undefined) (shop as any).about = about;
      if (tagline !== undefined) (shop as any).tagline = tagline;
      const incomingCategories = normalizeCategoryInput(categoriesInput);
      if (incomingCategories.length === 0 && typeof category === 'string' && normalizeCategoryName(category)) {
        incomingCategories.push(normalizeCategoryName(category));
      }
      if (incomingCategories.length > 0 || typeof category === 'string') {
        const resolvedCategories = await resolveCategoryCatalog(incomingCategories);
        (shop as any).categories = resolvedCategories.categories;
        (shop as any).categoryIds = resolvedCategories.categoryIds;
        shop.category = resolvedCategories.categories[0] || (typeof category === 'string' ? normalizeCategoryName(category) : shop.category);
      }
      const prevLogo = shop.logo;
      const prevAvatar = (shop as any).avatar as string | undefined;
      if (logo !== undefined) {
        if (logo && logo !== (prevLogo ?? '')) {
          (shop as any).shopAvatarCustom = true;
        }
        if (logo) shop.logo = logo;
      }
      if (banner) shop.banner = banner;
      if (avatar !== undefined) {
        if (avatar && avatar !== (prevAvatar ?? '')) {
          (shop as any).shopAvatarCustom = true;
        }
        if (avatar) (shop as any).avatar = avatar;
      }
      if (coverImage) (shop as any).coverImage = coverImage;
      if (address) shop.address = { ...shop.address, ...address };
      if (socialLinks) (shop as any).socialLinks = { ...(shop as any).socialLinks, ...socialLinks };
      if (settings) (shop as any).settings = { ...(shop as any).settings, ...settings };
      if (policies) (shop as any).policies = { ...(shop as any).policies, ...policies };

      await shop.save();

      return NextResponse.json({
        success: true,
        message: 'Shop updated successfully',
        data: {
          ...shop.toObject(),
          categories: (shop as any).categories || (shop.category ? [shop.category] : []),
          categoryIds: ((shop as any).categoryIds || []).map((id: any) => id.toString()),
        },
      });
    } catch (error: any) {
      console.error('Update shop error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update shop' },
        { status: 500 }
      );
    }
  })(request);
}

