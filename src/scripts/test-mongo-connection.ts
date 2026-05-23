/**
 * Quick MongoDB connection test – run from project root:
 *   npx tsx src/scripts/test-mongo-connection.ts
 *
 * Prints the exact error so we can see why Atlas is refusing the connection.
 */
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const uri = process.env.MONGODB_URI_STANDARD || process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI (or MONGODB_URI_STANDARD) not set in .env.local or .env");
  process.exit(1);
}

const masked = uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
console.log("Connecting to:", process.env.MONGODB_URI_STANDARD ? "[MONGODB_URI_STANDARD]" : "[MONGODB_URI]", masked);
console.log("");

mongoose
  .connect(uri, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log("✅ Connected successfully.");
    process.exit(0);
  })
  .catch((err: any) => {
    console.error("❌ Connection failed:");
    console.error("   Message:", err.message);
    // Dig out the real network error from TopologyDescription -> servers -> ServerDescription.error
    const topo = err.cause || err.reason;
    if (topo?.servers?.size) {
      for (const [, desc] of topo.servers) {
        if (desc?.error) {
          const e = desc.error;
          console.error("   Network error:", e.message ?? e);
          if (e.code) console.error("   Error code:", e.code);
        }
      }
    }
    if (err.code) console.error("   Code:", err.code);
    process.exit(1);
  });
