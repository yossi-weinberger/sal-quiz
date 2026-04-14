import productsJson from "@/data/products.json";
import type { Product, BasketGroupRow, BasketLine } from "./types";

function buildBasketGroupMeta(products: Product[]): BasketGroupRow[] {
  const active = products.filter((p) => p.is_active);
  const byGroup = new Map<number, Product[]>();
  for (const p of active) {
    const list = byGroup.get(p.group_id) ?? [];
    list.push(p);
    byGroup.set(p.group_id, list);
  }
  const ids = [...byGroup.keys()].sort((a, b) => a - b);
  return ids.map((gid) => {
    const lines = (byGroup.get(gid) ?? [])
      .slice()
      .sort((a, b) => a.display_order - b.display_order);
    const first = lines[0];
    return {
      id: gid,
      name_he: first.name_he,
      display_order: gid,
      image_path: first.image_path,
    };
  });
}

const activeProducts = (productsJson as Product[]).filter((p) => p.is_active);

/** Survey cards — one per distinct group_id on active products. */
export const BASKET_GROUP_META = buildBasketGroupMeta(activeProducts);

/** Number of basket products / survey questions (100 after merges). */
export const TOTAL_GROUPS = BASKET_GROUP_META.length;

/** Internal price rows in data (barcode / Rami Levy); equals TOTAL_GROUPS after merges. */
export const TOTAL_PRODUCT_LINES = (productsJson as Product[]).length;

/**
 * Active product lines with computed basket lines (one card per group).
 */
export function buildBasketLines(products: Product[]): BasketLine[] {
  const byGroup = new Map<number, Product[]>();
  for (const p of products) {
    const list = byGroup.get(p.group_id) ?? [];
    list.push(p);
    byGroup.set(p.group_id, list);
  }

  return BASKET_GROUP_META.map((m) => {
    const lines = byGroup.get(m.id) ?? [];
    const official_price =
      Math.round(lines.reduce((s, x) => s + x.official_price, 0) * 100) / 100;
    return {
      ...m,
      official_price,
      product_ids: lines.map((x) => x.id),
    };
  });
}

export function getProductLines(): Product[] {
  return (productsJson as Product[]).filter((p) => p.is_active);
}

export function productsInGroup(products: Product[], groupId: number): Product[] {
  return products.filter((p) => p.group_id === groupId);
}
