import { db } from "@/lib/db";
import { inventoryItems } from "@/drizzle/schema";
import { eq, ilike, and, gte, lte, sql } from "drizzle-orm";

export interface QueryFilters {
  vendorName?: string;
  invoiceNumber?: string;
  itemName?: string;
  itemCode?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minQuantity?: number;
  maxQuantity?: number;
}

export async function queryInventory(filters: QueryFilters = {}) {
  const conditions = [];

  if (filters.vendorName) {
    conditions.push(ilike(inventoryItems.vendorName, `%${filters.vendorName}%`));
  }

  if (filters.invoiceNumber) {
    conditions.push(ilike(inventoryItems.invoiceNumber, `%${filters.invoiceNumber}%`));
  }

  if (filters.itemName) {
    conditions.push(ilike(inventoryItems.itemName, `%${filters.itemName}%`));
  }

  if (filters.itemCode) {
    conditions.push(ilike(inventoryItems.itemCode, `%${filters.itemCode}%`));
  }

  if (filters.dateFrom) {
    conditions.push(gte(inventoryItems.uploadDate, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(inventoryItems.uploadDate, filters.dateTo));
  }

  if (filters.minQuantity !== undefined) {
    conditions.push(sql`${inventoryItems.quantity} >= ${filters.minQuantity}`);
  }

  if (filters.maxQuantity !== undefined) {
    conditions.push(sql`${inventoryItems.quantity} <= ${filters.maxQuantity}`);
  }

  if (conditions.length > 0) {
    return await db.select().from(inventoryItems).where(and(...conditions));
  }

  return await db.select().from(inventoryItems);
}

export async function getAllVendors() {
  const result = await db
    .selectDistinct({ vendorName: inventoryItems.vendorName })
    .from(inventoryItems);
  return result.map((r) => r.vendorName);
}

export async function getInventoryStats() {
  const result = await db
    .select({
      totalItems: sql<number>`count(*)::int`,
      totalQuantitySf: sql<number>`coalesce(sum(${inventoryItems.quantitySf}), 0)::numeric`,
      totalQuantitySlabs: sql<number>`coalesce(sum(${inventoryItems.quantitySlabs}), 0)::int`,
      uniqueVendors: sql<number>`count(distinct ${inventoryItems.vendorName})::int`,
    })
    .from(inventoryItems);

  return result[0] || { 
    totalItems: 0, 
    totalQuantitySf: 0, 
    totalQuantitySlabs: 0, 
    uniqueVendors: 0 
  };
}
