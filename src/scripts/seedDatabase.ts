/**
 * Database Seeding Script
 *
 * This script seeds the database with demo products and shops
 * to make the platform look active and provide examples for new users.
 *
 * Run with: npm run seed
 * Or: npx tsx src/scripts/seedDatabase.ts
 */

// CRITICAL: Load environment variables FIRST before any other imports
// This ensures MONGODB_URI is available when db.ts is imported
import dotenv from "dotenv";
import path from "path";

// Load .env.local first (Next.js convention), then fallback to .env
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");

const envLocalResult = dotenv.config({ path: envLocalPath });
const envResult = dotenv.config({ path: envPath });

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI not found in environment variables.");
  console.error("   Please ensure .env.local or .env contains MONGODB_URI");
  console.error(`   Checked: ${envLocalPath} ${envLocalResult.error ? "(not found)" : "(loaded)"}`);
  console.error(`   Checked: ${envPath} ${envResult.error ? "(not found)" : "(loaded)"}`);
  process.exit(1);
}

const maskedUri = process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
console.log(`📝 Using MongoDB URI: ${maskedUri}`);

import mongoose from "mongoose";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Shop from "@/models/Shop";
import Product from "@/models/Product";
import Category from "@/models/Category";

// Demo categories data
const demoCategories = [
  {
    name: "Fashion & Clothing",
    slug: "fashion-clothing",
    description: "Thrift fashion, vintage clothing, and trendy pieces",
    icon: "👗",
    sortOrder: 1,
  },
  {
    name: "Handmade Crafts",
    slug: "handmade-crafts",
    description: "Unique handmade items and artisanal products",
    icon: "🎨",
    sortOrder: 2,
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Bags, jewelry, watches, and fashion accessories",
    icon: "👜",
    sortOrder: 3,
  },
  {
    name: "Vintage Items",
    slug: "vintage-items",
    description: "Vintage clothing, collectibles, and retro finds",
    icon: "🕰️",
    sortOrder: 4,
  },
  {
    name: "Home & Decor",
    slug: "home-decor",
    description: "Home decor, furniture, and household items",
    icon: "🏠",
    sortOrder: 5,
  },
];

// Demo shops data
const demoShops = [
  {
    shopName: "Vintage Finds Lagos",
    shopSlug: "vintage-finds-lagos",
    description: "Curated vintage clothing and accessories from Lagos. Quality thrift fashion for the modern Nigerian.",
    category: "Fashion & Clothing",
    address: {
      addressLine1: "15 Admiralty Way",
      city: "Lekki",
      state: "Lagos",
      postalCode: "105102",
      country: "Nigeria",
    },
    ownerName: "Jane Smith",
    ownerEmail: "jane@vintagefinds.ng",
  },
  {
    shopName: "Handmade by Chioma",
    shopSlug: "handmade-by-chioma",
    description: "Beautiful handmade Ankara bags, jewelry, and accessories. Supporting local artisans in Nigeria.",
    category: "Handmade Crafts",
    address: {
      addressLine1: "22 Aminu Kano Crescent",
      city: "Abuja",
      state: "FCT",
      postalCode: "904101",
      country: "Nigeria",
    },
    ownerName: "Chioma Okafor",
    ownerEmail: "chioma@handmade.ng",
  },
  {
    shopName: "Thrift Fashion Hub",
    shopSlug: "thrift-fashion-hub",
    description: "Affordable thrift fashion for everyone. Quality second-hand clothing at great prices.",
    category: "Fashion & Clothing",
    address: {
      addressLine1: "17 Aba Road",
      city: "Port Harcourt",
      state: "Rivers",
      postalCode: "500102",
      country: "Nigeria",
    },
    ownerName: "Mike Johnson",
    ownerEmail: "mike@thrifthub.ng",
  },
  {
    shopName: "Retro Collectibles",
    shopSlug: "retro-collectibles",
    description: "Vintage items, collectibles, and retro fashion from the 80s and 90s.",
    category: "Vintage Items",
    address: {
      addressLine1: "8 Ahmadu Bello Way",
      city: "Kaduna",
      state: "Kaduna",
      postalCode: "800001",
      country: "Nigeria",
    },
    ownerName: "Amina Bello",
    ownerEmail: "amina@retro.ng",
  },
];

// Demo products data
const demoProducts = [
  // Vintage Finds Lagos products
  {
    shopSlug: "vintage-finds-lagos",
    products: [
      {
        title: "Vintage Denim Jacket",
        description: "Classic vintage denim jacket in excellent condition. Perfect for layering.",
        longDescription: "This vintage denim jacket is a timeless piece that never goes out of style. Made from high-quality denim, it features a classic fit and authentic vintage wash. Great condition with minimal wear. Perfect for adding a retro touch to any outfit.",
        category: "Fashion & Clothing",
        subcategory: "Jackets",
        condition: "like-new" as const,
        price: 15000,
        compareAtPrice: 20000,
        images: [
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1529927066849-66e1abc70a2e?w=800&h=800&fit=crop",
        ],
        inventory: { quantity: 3, trackQuantity: true },
        shipping: {
          weight: 0.8,
          freeShipping: false,
          shippingCost: 1500,
          processingTime: "3-5-days" as const,
        },
        specifications: {
          Size: "M",
          Material: "Denim",
          Color: "Blue",
          Brand: "Vintage",
        },
        seo: {
          tags: ["vintage", "denim", "jacket", "thrift", "fashion"],
        },
      },
      {
        title: "Leather Handbag",
        description: "Genuine leather handbag in brown. Spacious and stylish, perfect for everyday use.",
        longDescription: "Beautiful genuine leather handbag with multiple compartments. Made from high-quality leather, this bag is both functional and fashionable. Features adjustable straps and secure zipper closure. Great condition with only minor signs of use.",
        category: "Accessories",
        subcategory: "Bags",
        condition: "good" as const,
        price: 10000,
        images: [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop",
        ],
        inventory: { quantity: 2, trackQuantity: true },
        shipping: {
          weight: 0.5,
          freeShipping: false,
          shippingCost: 1200,
          processingTime: "3-5-days" as const,
        },
        specifications: {
          Material: "Genuine Leather",
          Color: "Brown",
          Dimensions: "30cm x 25cm x 15cm",
        },
        seo: {
          tags: ["leather", "handbag", "bag", "accessories"],
        },
      },
      {
        title: "Designer Sunglasses",
        description: "Stylish designer sunglasses with UV protection. Perfect for sunny Nigerian days.",
        longDescription: "High-quality designer sunglasses with 100% UV protection. Features polarized lenses and comfortable fit. Comes with original case. Perfect for protecting your eyes while looking stylish.",
        category: "Accessories",
        subcategory: "Sunglasses",
        condition: "new" as const,
        price: 18000,
        compareAtPrice: 25000,
        images: [
          "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1519744346363-dc63c0c14fd0?w=800&h=800&fit=crop",
        ],
        inventory: { quantity: 5, trackQuantity: true },
        shipping: {
          weight: 0.1,
          freeShipping: true,
          shippingCost: 0,
          processingTime: "1-2-days" as const,
        },
        specifications: {
          UV_Protection: "100%",
          Frame_Material: "Plastic",
          Lens_Color: "Dark",
        },
        seo: {
          tags: ["sunglasses", "designer", "accessories", "uv protection"],
        },
      },
    ],
  },
  // Handmade by Chioma products
  {
    shopSlug: "handmade-by-chioma",
    products: [
      {
        title: "Handmade Ankara Bag",
        description: "Beautiful handmade Ankara fabric bag. Unique design, perfect for special occasions.",
        longDescription: "This stunning handmade Ankara bag is crafted with love and attention to detail. Made from authentic Nigerian Ankara fabric, each bag is unique. Features a spacious interior, secure zipper, and comfortable handles. Perfect for weddings, parties, or everyday use. Supporting local artisans.",
        category: "Handmade Crafts",
        subcategory: "Bags",
        condition: "new" as const,
        price: 12000,
        images: [
          "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop",
        ],
        inventory: { quantity: 8, trackQuantity: true },
        shipping: {
          weight: 0.4,
          freeShipping: false,
          shippingCost: 1000,
          processingTime: "3-5-days" as const,
        },
        specifications: {
          Material: "Ankara Fabric",
          Handmade: "Yes",
          Dimensions: "35cm x 30cm x 10cm",
        },
        seo: {
          tags: ["ankara", "handmade", "bag", "nigerian", "fabric"],
        },
      },
      {
        title: "Beaded Ankara Jewelry Set",
        description: "Handcrafted beaded jewelry set with Ankara fabric accents. Necklace, earrings, and bracelet.",
        longDescription: "Beautiful handcrafted jewelry set featuring traditional Nigerian beads and Ankara fabric accents. Each piece is carefully made by skilled artisans. The set includes a statement necklace, matching earrings, and a bracelet. Perfect for traditional or modern outfits.",
        category: "Handmade Crafts",
        subcategory: "Jewelry",
        condition: "new" as const,
        price: 8500,
        images: [
          "https://images.unsplash.com/photo-1611591437281-8a0c18e1e0a1?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1603561591412-071a3e5e6b0a?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=800&h=800&fit=crop",
        ],
        inventory: { quantity: 6, trackQuantity: true },
        shipping: {
          weight: 0.2,
          freeShipping: true,
          shippingCost: 0,
          processingTime: "1-2-days" as const,
        },
        specifications: {
          Material: "Beads, Ankara Fabric",
          Handmade: "Yes",
          Set_Includes: "Necklace, Earrings, Bracelet",
        },
        seo: {
          tags: ["ankara", "jewelry", "handmade", "beads", "nigerian"],
        },
      },
    ],
  },
  // Thrift Fashion Hub products
  {
    shopSlug: "thrift-fashion-hub",
    products: [
      {
        title: "Classic White Sneakers",
        description: "Clean white sneakers in good condition. Versatile and comfortable for everyday wear.",
        longDescription: "Classic white sneakers that go with everything. In good condition with minimal wear. Comfortable for walking and perfect for casual outfits. These timeless sneakers are a wardrobe essential.",
        category: "Fashion & Clothing",
        subcategory: "Shoes",
        condition: "good" as const,
        price: 8000,
        compareAtPrice: 15000,
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
        ],
        inventory: { quantity: 4, trackQuantity: true },
        shipping: {
          weight: 0.6,
          freeShipping: false,
          shippingCost: 1500,
          processingTime: "3-5-days" as const,
        },
        specifications: {
          Size: "42",
          Condition: "Good",
          Color: "White",
        },
        seo: {
          tags: ["sneakers", "shoes", "thrift", "white", "casual"],
        },
      },
      {
        title: "Vintage Floral Dress",
        description: "Beautiful vintage floral print dress. Perfect for parties and special occasions.",
        longDescription: "Stunning vintage floral dress in excellent condition. Features a flattering fit and beautiful print. This timeless piece can be dressed up or down. Perfect for weddings, parties, or a special date night.",
        category: "Fashion & Clothing",
        subcategory: "Dresses",
        condition: "like-new" as const,
        price: 12000,
        images: [
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ac?w=800&h=800&fit=crop",
        ],
        inventory: { quantity: 2, trackQuantity: true },
        shipping: {
          weight: 0.3,
          freeShipping: false,
          shippingCost: 1200,
          processingTime: "3-5-days" as const,
        },
        specifications: {
          Size: "M",
          Material: "Polyester",
          Pattern: "Floral",
        },
        seo: {
          tags: ["dress", "vintage", "floral", "thrift", "fashion"],
        },
      },
    ],
  },
  // Retro Collectibles products
  {
    shopSlug: "retro-collectibles",
    products: [
      {
        title: "Vintage 90s Windbreaker",
        description: "Authentic 90s windbreaker in vibrant colors. Retro style that's back in fashion.",
        longDescription: "Authentic 90s windbreaker in excellent vintage condition. Features vibrant colors and classic 90s design. This retro piece is perfect for anyone who loves vintage fashion. Great condition with all zippers working perfectly.",
        category: "Vintage Items",
        subcategory: "Jackets",
        condition: "good" as const,
        price: 11000,
        images: [
          "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=800&fit=crop",
        ],
        inventory: { quantity: 3, trackQuantity: true },
        shipping: {
          weight: 0.5,
          freeShipping: false,
          shippingCost: 1300,
          processingTime: "3-5-days" as const,
        },
        specifications: {
          Size: "L",
          Era: "1990s",
          Condition: "Good",
          Color: "Multi-color",
        },
        seo: {
          tags: ["vintage", "90s", "windbreaker", "retro", "collectible"],
        },
      },
      {
        title: "Retro High-Waisted Jeans",
        description: "Vintage high-waisted jeans in classic blue. Perfect fit and authentic vintage style.",
        longDescription: "Authentic vintage high-waisted jeans in classic blue wash. These retro jeans feature the perfect fit and authentic vintage style that's trending again. Great condition with minimal wear. A must-have for vintage fashion lovers.",
        category: "Vintage Items",
        subcategory: "Jeans",
        condition: "like-new" as const,
        price: 9500,
        images: [
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=800&fit=crop",
          "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&h=800&fit=crop",
        ],
        inventory: { quantity: 5, trackQuantity: true },
        shipping: {
          weight: 0.7,
          freeShipping: false,
          shippingCost: 1400,
          processingTime: "3-5-days" as const,
        },
        specifications: {
          Size: "28",
          Material: "Denim",
          Style: "High-waisted",
          Color: "Blue",
        },
        seo: {
          tags: ["jeans", "vintage", "high-waisted", "retro", "denim"],
        },
      },
    ],
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect directly to MongoDB using the URI we loaded from .env.local
    // This bypasses the cached connection in db.ts which reads env vars at module load time
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set in environment variables");
    }

    // Disconnect any existing connection first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      bufferCommands: false,
    });
    console.log("✅ MongoDB connected");

    // Step 1: Create or get categories
    console.log("📁 Creating categories...");
    const categoryMap: Record<string, mongoose.Types.ObjectId> = {};

    for (const catData of demoCategories) {
      let category = await Category.findOne({ slug: catData.slug });
      if (!category) {
        category = await Category.create({
          ...catData,
          isActive: true,
        });
        console.log(`  ✅ Created category: ${catData.name}`);
      } else {
        console.log(`  ℹ️  Category exists: ${catData.name}`);
      }
      categoryMap[catData.name] = category._id;
    }

    // Step 2: Create demo sellers (users) and shops
    console.log("\n🏪 Creating demo shops...");
    const shopMap: Record<string, { shop: any; seller: any }> = {};

    for (const shopData of demoShops) {
      // Check if shop already exists
      let shop = await Shop.findOne({ shopSlug: shopData.shopSlug });
      let seller;
      
      if (!shop) {
        // Create demo seller user
        seller = await User.findOne({ email: shopData.ownerEmail });
        if (!seller) {
          seller = await User.create({
            fullName: shopData.ownerName,
            email: shopData.ownerEmail,
            phone: `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5", // Hashed "password123"
            role: "seller",
            accountStatus: "active",
            emailVerified: true,
            phoneVerified: true,
            roleSelected: true,
            kyc: {
              status: "approved",
              businessName: shopData.shopName,
              businessType: "individual",
              bankName: "Access Bank",
              accountNumber: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
              accountName: shopData.ownerName,
            },
          });
          console.log(`  ✅ Created seller: ${shopData.ownerName}`);
        }

        // Create shop
        shop = await Shop.create({
          owner: seller._id,
          shopName: shopData.shopName,
          shopSlug: shopData.shopSlug,
          description: shopData.description,
          category: shopData.category,
          address: shopData.address,
          verification: {
            status: "verified",
            verifiedAt: new Date(),
          },
          status: "active",
          stats: {
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0,
            averageRating: 4.5,
            reviewCount: Math.floor(Math.random() * 50) + 10,
            followerCount: Math.floor(Math.random() * 200) + 50,
            viewCount: Math.floor(Math.random() * 1000) + 200,
          },
        });

        // Link shop to seller
        await User.findByIdAndUpdate(seller._id, {
          $set: { shop: shop._id },
        });

        console.log(`  ✅ Created shop: ${shopData.shopName}`);
      } else {
        console.log(`  ℹ️  Shop exists: ${shopData.shopName}`);
        seller = await User.findById(shop.owner);
      }

      shopMap[shopData.shopSlug] = { shop, seller };
    }

    // Step 3: Create demo products
    console.log("\n📦 Creating demo products...");
    let totalProducts = 0;

    for (const shopProducts of demoProducts) {
      const { shop, seller } = shopMap[shopProducts.shopSlug];
      if (!shop || !seller) continue;

      for (const productData of shopProducts.products) {
        // Check if product already exists
        const existingProduct = await Product.findOne({
          slug: productData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
        });

        if (!existingProduct) {
          const categoryId = categoryMap[productData.category];
          if (!categoryId) {
            console.log(`  ⚠️  Category not found: ${productData.category}`);
            continue;
          }

          const slug = productData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          await Product.create({
            seller: seller._id,
            shop: shop._id,
            title: productData.title,
            slug,
            description: productData.description,
            longDescription: productData.longDescription,
            category: categoryId,
            subcategory: productData.subcategory,
            condition: productData.condition,
            price: productData.price,
            ...(("compareAtPrice" in productData && productData.compareAtPrice)
              ? { compareAtPrice: productData.compareAtPrice }
              : {}),
            currency: "NGN",
            images: productData.images,
            inventory: productData.inventory,
            shipping: productData.shipping,
            specifications: productData.specifications,
            seo: productData.seo,
            status: "active",
            featured: Math.random() > 0.7, // 30% chance of being featured
            views: Math.floor(Math.random() * 500) + 50,
            likes: Math.floor(Math.random() * 100) + 10,
            averageRating: 4 + Math.random(), // 4.0 to 5.0
            reviewCount: Math.floor(Math.random() * 30) + 5,
          });

          totalProducts++;
          console.log(`  ✅ Created product: ${productData.title}`);
        } else {
          console.log(`  ℹ️  Product exists: ${productData.title}`);
        }
      }

      // Update shop product count
      const productCount = await Product.countDocuments({ shop: shop._id });
      await Shop.findByIdAndUpdate(shop._id, {
        $set: { "stats.totalProducts": productCount },
      });
    }

    console.log(`\n✅ Seeding complete! Created ${totalProducts} products.`);
    console.log("\n📊 Summary:");
    console.log(`  - Categories: ${demoCategories.length}`);
    console.log(`  - Shops: ${demoShops.length}`);
    console.log(`  - Products: ${totalProducts}`);
    console.log("\n🎉 Database seeded successfully!");
  } catch (error: any) {
    console.error("❌ Seeding error:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed.");
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedDatabase;





