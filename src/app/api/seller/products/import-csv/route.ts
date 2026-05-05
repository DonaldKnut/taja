import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Shop from "@/models/Shop";
import { requireRole } from "@/lib/middleware";

export const dynamic = "force-dynamic";

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().trim();
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  return requireRole(["seller", "admin"])(async (req, user) => {
    try {
      await connectDB();

      const shop = await Shop.findOne({ owner: user.userId }).lean();
      if (!shop) {
        return NextResponse.json(
          { success: false, message: "Create your shop first before importing products." },
          { status: 403 }
        );
      }

      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const dryRun = String(formData.get("dryRun") || "").toLowerCase() === "true";
      if (!file) {
        return NextResponse.json(
          { success: false, message: "CSV file is required (field: file)." },
          { status: 400 }
        );
      }
      if (!file.name.toLowerCase().endsWith(".csv")) {
        return NextResponse.json(
          { success: false, message: "Please upload a valid .csv file." },
          { status: 400 }
        );
      }

      const text = await file.text();
      const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (rows.length < 2) {
        return NextResponse.json(
          { success: false, message: "CSV must include header row and at least one data row." },
          { status: 400 }
        );
      }

      const headers = splitCsvLine(rows[0]).map(normalizeHeader);
      const indexOf = (name: string) => headers.indexOf(name);
      const requiredHeaders = ["title", "description", "category", "price", "images"];
      const missing = requiredHeaders.filter((h) => indexOf(h) < 0);
      if (missing.length > 0) {
        return NextResponse.json(
          { success: false, message: `Missing required CSV column(s): ${missing.join(", ")}` },
          { status: 400 }
        );
      }

      const { default: Category } = await import("@/models/Category");
      const mongoose = (await import("mongoose")).default;

      const createdIds: string[] = [];
      let wouldCreate = 0;
      const errors: Array<{ row: number; message: string }> = [];

      for (let rowIdx = 1; rowIdx < rows.length; rowIdx += 1) {
        try {
          const values = splitCsvLine(rows[rowIdx]);
          const get = (name: string) => {
            const idx = indexOf(name);
            return idx >= 0 ? (values[idx] || "").trim() : "";
          };

          const title = get("title");
          const description = get("description");
          const categoryRaw = get("category");
          const priceRaw = get("price");
          const imagesRaw = get("images");
          const videosRaw = get("videos");

          if (!title || !description || !categoryRaw || !priceRaw || !imagesRaw) {
            errors.push({ row: rowIdx + 1, message: "Required fields missing in row." });
            continue;
          }

          let finalCategoryId: any = categoryRaw;
          if (!mongoose.Types.ObjectId.isValid(categoryRaw)) {
            const foundCategory = await Category.findOne({
              $or: [
                { name: { $regex: new RegExp(`^${categoryRaw}$`, "i") } },
                { slug: toSlug(categoryRaw) },
              ],
            }).lean();
            if (!foundCategory) {
              errors.push({ row: rowIdx + 1, message: `Category "${categoryRaw}" not found.` });
              continue;
            }
            finalCategoryId = foundCategory._id;
          }

          const price = Number(priceRaw);
          if (!Number.isFinite(price) || price < 0) {
            errors.push({ row: rowIdx + 1, message: "Invalid price." });
            continue;
          }

          const images = imagesRaw.split("|").map((x) => x.trim()).filter(Boolean);
          if (images.length === 0) {
            errors.push({ row: rowIdx + 1, message: "At least one image URL is required." });
            continue;
          }

          const videos = videosRaw
            ? videosRaw
                .split("|")
                .map((x) => x.trim())
                .filter(Boolean)
                .slice(0, 2)
                .map((url) => ({ url, type: "video" as const }))
            : [];

          const stock = Math.max(0, Number(get("stock") || "0") || 0);
          const shippingCost = Math.max(0, Number(get("shippingcost") || "0") || 0);
          const weight = Math.max(0, Number(get("weight") || "0") || 0);
          const status = get("status") === "active" ? "active" : "draft";

          const baseSlug = toSlug(title) || `product-${Date.now()}-${rowIdx}`;
          const exists = await Product.findOne({ slug: baseSlug }).select("_id").lean();
          const slug = exists ? `${baseSlug}-${Date.now()}-${rowIdx}` : baseSlug;

          if (dryRun) {
            wouldCreate += 1;
          } else {
            const product = await Product.create({
              seller: user.userId,
              shop: (shop as any)._id,
              title,
              slug,
              description,
              category: finalCategoryId,
              price,
              images,
              videos,
              inventory: { quantity: stock, trackQuantity: true, moq: 1 },
              shipping: { weight, freeShipping: false, shippingCost, processingTime: "3-5-days" },
              status,
            });
            createdIds.push(String(product._id));
          }
        } catch (err: any) {
          errors.push({ row: rowIdx + 1, message: err?.message || "Failed to import row" });
        }
      }

      return NextResponse.json({
        success: true,
        message: dryRun
          ? `Validation completed. ${wouldCreate} row(s) are ready to import.`
          : `Imported ${createdIds.length} product(s).`,
        data: {
          dryRun,
          imported: createdIds.length,
          wouldCreate,
          failed: errors.length,
          errors,
        },
      });
    } catch (error: any) {
      console.error("Seller CSV import error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to import CSV" },
        { status: 500 }
      );
    }
  })(request);
}
