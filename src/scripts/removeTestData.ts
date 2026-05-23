import "dotenv/config";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Shop from "@/models/Shop";

async function main() {
  try {
    await connectDB();

    const titleRegex = /^test\b/i;

    const productResult = await Product.deleteMany({
      $or: [
        { title: titleRegex },
        { title: /Test Handmade Ankara Bag/i },
        { title: /Test Vintage Denim Jacket/i },
      ],
    });

    const shopResult = await Shop.deleteMany({
      $or: [
        { shopName: titleRegex },
        { shopSlug: /^test\b/i },
      ],
    });

    console.log("Removed test data:", {
      productsDeleted: productResult.deletedCount,
      shopsDeleted: shopResult.deletedCount,
    });
  } catch (err) {
    console.error("Error removing test data:", err);
    process.exitCode = 1;
  } finally {
    // Allow Node to exit
    process.exit();
  }
}

main();

