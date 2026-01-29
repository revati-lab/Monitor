import { db } from "@/lib/db";
import { sales } from "@/drizzle/schema";
import { ilike, and, sql, desc, eq } from "drizzle-orm";

export interface QueryFilters {
  userId?: string;
  vendorName?: string;
  invoiceNumber?: string;
  transferNumber?: string;
  itemName?: string;
  itemCode?: string;
  slabName?: string;
  serialNum?: string;
  block?: string;
  minQuantity?: number;
  maxQuantity?: number;
  isBroken?: boolean;
}

// Query consignment items from sales table
export async function queryConsignment(filters: QueryFilters = {}) {
  const conditions = [eq(sales.documentType, "transfer-consignment")];

  if (filters.userId) {
    conditions.push(eq(sales.userId, filters.userId));
  }

  if (filters.vendorName) {
    conditions.push(ilike(sales.vendorName, `%${filters.vendorName}%`));
  }

  if (filters.transferNumber) {
    conditions.push(ilike(sales.transferNumber, `%${filters.transferNumber}%`));
  }

  if (filters.serialNum) {
    conditions.push(ilike(sales.serialNum, `%${filters.serialNum}%`));
  }

  if (filters.block) {
    conditions.push(ilike(sales.block, `%${filters.block}%`));
  }

  if (filters.itemName) {
    conditions.push(ilike(sales.itemName, `%${filters.itemName}%`));
  }

  if (filters.itemCode) {
    conditions.push(ilike(sales.itemCode, `%${filters.itemCode}%`));
  }

  if (filters.slabName) {
    conditions.push(ilike(sales.slabName, `%${filters.slabName}%`));
  }

  if (filters.isBroken !== undefined) {
    conditions.push(eq(sales.isBroken, filters.isBroken));
  }

  return await db.select().from(sales).where(and(...conditions));
}

// Query own slabs items from sales table
export async function queryOwnSlabs(filters: QueryFilters = {}) {
  const conditions = [eq(sales.documentType, "invoice-inhouse")];

  if (filters.userId) {
    conditions.push(eq(sales.userId, filters.userId));
  }

  if (filters.vendorName) {
    conditions.push(ilike(sales.vendorName, `%${filters.vendorName}%`));
  }

  if (filters.invoiceNumber) {
    conditions.push(ilike(sales.invoiceNumber, `%${filters.invoiceNumber}%`));
  }

  if (filters.serialNum) {
    conditions.push(ilike(sales.serialNum, `%${filters.serialNum}%`));
  }

  if (filters.block) {
    conditions.push(ilike(sales.block, `%${filters.block}%`));
  }

  if (filters.itemName) {
    conditions.push(ilike(sales.itemName, `%${filters.itemName}%`));
  }

  if (filters.itemCode) {
    conditions.push(ilike(sales.itemCode, `%${filters.itemCode}%`));
  }

  if (filters.slabName) {
    conditions.push(ilike(sales.slabName, `%${filters.slabName}%`));
  }

  if (filters.isBroken !== undefined) {
    conditions.push(eq(sales.isBroken, filters.isBroken));
  }

  return await db.select().from(sales).where(and(...conditions));
}

// Query both tables and combine results
export async function queryAllInventory(filters: QueryFilters = {}) {
  const [consignmentItems, ownSlabItems] = await Promise.all([
    queryConsignment(filters),
    queryOwnSlabs(filters),
  ]);

  return {
    consignment: consignmentItems,
    ownSlabs: ownSlabItems,
    all: [...consignmentItems.map(i => ({ ...i, source: 'consignment' as const })),
          ...ownSlabItems.map(i => ({ ...i, source: 'own_slabs' as const }))],
  };
}

// Get consignment stats (totalItems includes all, slab counts exclude broken)
export async function getConsignmentStats(userId?: string) {
  const baseConditions = [eq(sales.documentType, "transfer-consignment")];
  if (userId) baseConditions.push(eq(sales.userId, userId));

  // Get total items count (including broken)
  const totalResult = await db
    .select({
      totalItems: sql<number>`count(*)::int`,
      uniqueVendors: sql<number>`count(distinct ${sales.vendorName})::int`,
    })
    .from(sales)
    .where(and(...baseConditions));

  // Get slab counts (excluding broken)
  const activeResult = await db
    .select({
      totalQuantitySf: sql<number>`coalesce(sum(${sales.quantitySf}), 0)::numeric`,
      totalQuantitySlabs: sql<number>`coalesce(sum(coalesce(nullif(${sales.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(sales)
    .where(and(...baseConditions, eq(sales.isBroken, false)));

  // Get broken slab counts
  const brokenResult = await db
    .select({
      brokenSlabs: sql<number>`coalesce(sum(coalesce(nullif(${sales.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(sales)
    .where(and(...baseConditions, eq(sales.isBroken, true)));

  return {
    totalItems: totalResult[0]?.totalItems || 0,
    totalQuantitySf: activeResult[0]?.totalQuantitySf || 0,
    totalQuantitySlabs: activeResult[0]?.totalQuantitySlabs || 0,
    brokenSlabs: brokenResult[0]?.brokenSlabs || 0,
    uniqueVendors: totalResult[0]?.uniqueVendors || 0,
  };
}

// Get own slabs stats (totalItems includes all, slab counts exclude broken)
export async function getOwnSlabsStats(userId?: string) {
  const baseConditions = [eq(sales.documentType, "invoice-inhouse")];
  if (userId) baseConditions.push(eq(sales.userId, userId));

  // Get total items count (including broken)
  const totalResult = await db
    .select({
      totalItems: sql<number>`count(*)::int`,
      uniqueVendors: sql<number>`count(distinct ${sales.vendorName})::int`,
    })
    .from(sales)
    .where(and(...baseConditions));

  // Get slab counts (excluding broken)
  const activeResult = await db
    .select({
      totalQuantitySf: sql<number>`coalesce(sum(${sales.quantitySf}), 0)::numeric`,
      totalQuantitySlabs: sql<number>`coalesce(sum(coalesce(nullif(${sales.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(sales)
    .where(and(...baseConditions, eq(sales.isBroken, false)));

  // Get broken slab counts
  const brokenResult = await db
    .select({
      brokenSlabs: sql<number>`coalesce(sum(coalesce(nullif(${sales.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(sales)
    .where(and(...baseConditions, eq(sales.isBroken, true)));

  return {
    totalItems: totalResult[0]?.totalItems || 0,
    totalQuantitySf: activeResult[0]?.totalQuantitySf || 0,
    totalQuantitySlabs: activeResult[0]?.totalQuantitySlabs || 0,
    brokenSlabs: brokenResult[0]?.brokenSlabs || 0,
    uniqueVendors: totalResult[0]?.uniqueVendors || 0,
  };
}

// Get combined inventory stats
export async function getInventoryStats(userId?: string) {
  const [consignmentStats, ownSlabsStats] = await Promise.all([
    getConsignmentStats(userId),
    getOwnSlabsStats(userId),
  ]);

  return {
    consignment: consignmentStats,
    ownSlabs: ownSlabsStats,
    total: {
      totalItems: consignmentStats.totalItems + ownSlabsStats.totalItems,
      totalQuantitySf: Number(consignmentStats.totalQuantitySf) + Number(ownSlabsStats.totalQuantitySf),
      totalQuantitySlabs: consignmentStats.totalQuantitySlabs + ownSlabsStats.totalQuantitySlabs,
      brokenSlabs: consignmentStats.brokenSlabs + ownSlabsStats.brokenSlabs,
      uniqueVendors: consignmentStats.uniqueVendors, // Only count consignment vendors
    }
  };
}

// Get consignment slabs by slab name (excludes broken slabs)
export async function getConsignmentBySlabName(userId?: string) {
  const conditions = [eq(sales.documentType, "transfer-consignment"), eq(sales.isBroken, false)];
  if (userId) conditions.push(eq(sales.userId, userId));

  const result = await db
    .select({
      name: sql<string>`coalesce(${sales.slabName}, 'Unknown')`,
      value: sql<number>`coalesce(sum(coalesce(nullif(${sales.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(sales)
    .where(and(...conditions))
    .groupBy(sales.slabName)
    .orderBy(desc(sql`sum(coalesce(nullif(${sales.quantitySlabs}, 0), 1))`))
    .limit(10);

  return result;
}

// Get own slabs by slab name (excludes broken slabs)
export async function getOwnSlabsBySlabName(userId?: string) {
  const conditions = [eq(sales.documentType, "invoice-inhouse"), eq(sales.isBroken, false)];
  if (userId) conditions.push(eq(sales.userId, userId));

  const result = await db
    .select({
      name: sql<string>`coalesce(${sales.slabName}, 'Unknown')`,
      value: sql<number>`coalesce(sum(coalesce(nullif(${sales.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(sales)
    .where(and(...conditions))
    .groupBy(sales.slabName)
    .orderBy(desc(sql`sum(coalesce(nullif(${sales.quantitySlabs}, 0), 1))`))
    .limit(10);

  return result;
}

// Get consignment slabs by vendor (excludes broken slabs)
export async function getConsignmentByVendor(userId?: string) {
  const conditions = [eq(sales.documentType, "transfer-consignment"), eq(sales.isBroken, false)];
  if (userId) conditions.push(eq(sales.userId, userId));

  const result = await db
    .select({
      name: sql<string>`coalesce(${sales.vendorName}, 'Unknown')`,
      value: sql<number>`coalesce(sum(coalesce(nullif(${sales.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(sales)
    .where(and(...conditions))
    .groupBy(sales.vendorName)
    .orderBy(desc(sql`sum(coalesce(nullif(${sales.quantitySlabs}, 0), 1))`))
    .limit(10);

  return result;
}

// Get own slabs by vendor (excludes broken slabs)
export async function getOwnSlabsByVendor(userId?: string) {
  const conditions = [eq(sales.documentType, "invoice-inhouse"), eq(sales.isBroken, false)];
  if (userId) conditions.push(eq(sales.userId, userId));

  const result = await db
    .select({
      name: sql<string>`coalesce(${sales.vendorName}, 'Unknown')`,
      value: sql<number>`coalesce(sum(coalesce(nullif(${sales.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(sales)
    .where(and(...conditions))
    .groupBy(sales.vendorName)
    .orderBy(desc(sql`sum(coalesce(nullif(${sales.quantitySlabs}, 0), 1))`))
    .limit(10);

  return result;
}

// Query both tables and return combined results (for search/chat API)
export async function queryInventory(filters: QueryFilters = {}) {
  const result = await queryAllInventory(filters);
  return result.all;
}

// Combined slab count by slab name (from both tables)
export async function getSlabsBySlabName(userId?: string) {
  const [consignmentData, ownSlabsData] = await Promise.all([
    getConsignmentBySlabName(userId),
    getOwnSlabsBySlabName(userId),
  ]);

  // Combine data from both tables
  const combined: Record<string, number> = {};
  for (const item of consignmentData) {
    combined[item.name] = (combined[item.name] || 0) + Number(item.value);
  }
  for (const item of ownSlabsData) {
    combined[item.name] = (combined[item.name] || 0) + Number(item.value);
  }

  // Convert to array and sort by value
  return Object.entries(combined)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

// Slab count by vendor (consignment only)
export async function getSlabsByVendor(userId?: string) {
  // Only return consignment vendor data
  return getConsignmentByVendor(userId);
}

// Get unique customer names (transferredTo) from own slabs
export async function getCustomerNames(userId?: string): Promise<string[]> {
  const conditions = [eq(sales.documentType, "invoice-inhouse")];
  if (userId) conditions.push(eq(sales.userId, userId));

  const result = await db
    .selectDistinct({ transferredTo: sales.transferredTo })
    .from(sales)
    .where(and(...conditions));

  return result
    .map((r) => r.transferredTo)
    .filter((name): name is string => !!name)
    .sort();
}

// Legacy function for backward compatibility
export async function getAllVendors(userId?: string) {
  const conditions = [];
  if (userId) conditions.push(eq(sales.userId, userId));

  const result = await db
    .selectDistinct({ vendorName: sales.vendorName })
    .from(sales)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result
    .map(r => r.vendorName)
    .filter((name): name is string => !!name);
}

// Get vendor details with contact information and slab counts (consignment only)
export interface VendorDetails {
  vendorName: string;
  vendorAddress: string | null;
  vendorPhone: string | null;
  vendorEmail: string | null;
  slabCount: number;
  source: 'consignment';
}

export async function getVendorDetails(userId?: string): Promise<VendorDetails[]> {
  const conditions = [eq(sales.documentType, "transfer-consignment"), eq(sales.isBroken, false)];
  if (userId) conditions.push(eq(sales.userId, userId));

  // Get vendor info from consignment only (excludes broken slabs)
  const consignmentVendors = await db
    .select({
      vendorName: sales.vendorName,
      vendorAddress: sales.vendorAddress,
      vendorPhone: sales.vendorPhone,
      slabCount: sql<number>`coalesce(sum(coalesce(nullif(${sales.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(sales)
    .where(and(...conditions))
    .groupBy(sales.vendorName, sales.vendorAddress, sales.vendorPhone);

  // Build vendor list from consignment only
  const vendorMap = new Map<string, VendorDetails>();

  for (const v of consignmentVendors) {
    if (!v.vendorName) continue;
    vendorMap.set(v.vendorName, {
      vendorName: v.vendorName,
      vendorAddress: v.vendorAddress,
      vendorPhone: v.vendorPhone,
      vendorEmail: null,
      slabCount: Number(v.slabCount) || 0,
      source: 'consignment',
    });
  }

  // Convert to array and sort by slab count
  return Array.from(vendorMap.values())
    .sort((a, b) => b.slabCount - a.slabCount);
}
