/**
 * Survey groups (1–102) match the 102 government basket products.
 * Internal price rows may list extra barcode lines; lines 35–40 map to one group (diapers).
 */
export const DIAPER_GROUP_ID = 35;

export const DIAPER_GROUP_NAME_HE = "חיתולים — מגוון מידות (סל רשמי)";

export function productToGroupId(productId: number): number {
  if (productId <= 34) return productId;
  if (productId >= 35 && productId <= 40) return DIAPER_GROUP_ID;
  return productId - 5;
}
