import User from "@/models/User";

/** Match logistics profile by linked account or by same email (guest apply → later register). */
export async function logisticsPartnerQueryForAuthUser(userId: string) {
  const currentUser = await User.findById(userId).select("email").lean();
  const query: Record<string, unknown> = { $or: [{ user: userId }] };
  if (currentUser?.email) {
    query.$or.push({ email: String(currentUser.email).toLowerCase() });
  }
  return query;
}
