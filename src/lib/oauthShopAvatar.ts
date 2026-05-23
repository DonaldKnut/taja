import Shop from "@/models/Shop";

/**
 * When the owner signs in with Google, copy their profile photo to the shop
 * logo/avatar only if they have not set a custom shop avatar in the dashboard
 * (or admin). Cover/banner is never set here.
 */
export async function applyGooglePictureToSellerShop(
  ownerUserId: string,
  picture: string | null | undefined
): Promise<void> {
  const url = typeof picture === "string" ? picture.trim() : "";
  if (!url) return;

  const shop = await Shop.findOne({ owner: ownerUserId });
  if (!shop) return;

  const custom = (shop as { shopAvatarCustom?: boolean }).shopAvatarCustom;
  if (custom === true) return;

  const av = (shop as { avatar?: string }).avatar;
  const hasBranding =
    (typeof shop.logo === "string" && shop.logo.trim()) ||
    (typeof av === "string" && av.trim().length > 0);
  // Legacy documents had no flag: if they already set a shop image, lock it once (do not stomp).
  if (custom !== false && hasBranding) {
    (shop as { shopAvatarCustom?: boolean }).shopAvatarCustom = true;
    await shop.save({ validateBeforeSave: false });
    return;
  }

  shop.logo = url;
  (shop as { avatar?: string }).avatar = url;
  await shop.save({ validateBeforeSave: false });
}
