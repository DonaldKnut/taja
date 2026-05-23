/** Canonical Taja.Shop logo (headers, emails, structured data). */
export const TAJA_LOGO_URL =
  "https://res.cloudinary.com/dyaetoldv/image/upload/v1778537774/taja__-removebg-preview-removebg-preview_w5g9br.png";

/** PWA / install / homescreen icon (Cloudinary). Original upload; use `tajaAppIconSized` for exact pixel sizes. */
export const TAJA_APP_ICON_SRC =
  "https://res.cloudinary.com/dyaetoldv/image/upload/v1778600599/taja___-removebg-preview_o7m88c.png";

const TAJA_APP_ICON_VERSION_PATH = "v1778600599/taja___-removebg-preview_o7m88c.png";

/** Square PNG at `width`×`height` for manifest / Apple touch / favicon-style links. */
export function tajaAppIconSized(width: number, height: number = width): string {
  return `https://res.cloudinary.com/dyaetoldv/image/upload/w_${width},h_${height},c_fill,f_png/${TAJA_APP_ICON_VERSION_PATH}`;
}

/** Retail-style placeholder when a product has no images (cards, gallery, cart, emails). */
export const PRODUCT_IMAGE_PLACEHOLDER_URL =
  "https://res.cloudinary.com/dyaetoldv/image/upload/v1778534761/design_an_image_of_a_202605112225_1_xzyh1v.jpg";
