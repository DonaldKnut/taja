/**
 * Side-effect: register Mongoose models before populate() or refs run.
 * Next.js loads API routes in separate chunks; importing only Product is not enough
 * if the handler calls .populate('shop') — Shop must already be registered.
 */
import "@/models/User";
import "@/models/Category";
import "@/models/Shop";
import "@/models/Product";
