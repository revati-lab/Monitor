import { db } from "@/lib/db";
import { consignment, ownSlabs } from "@/drizzle/schema";
import { ilike, and, sql, desc, eq } from "drizzle-orm";

export interface QueryFilters {
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

// Query consignment table
export async function queryConsignment(filters: QueryFilters = {}) {
  const conditions = [];

  if (filters.vendorName) {
    conditions.push(ilike(consignment.vendorName, `%${filters.vendorName}%`));
  }

  if (filters.transferNumber) {
    conditions.push(ilike(consignment.transferNumber, `%${filters.transferNumber}%`));
  }

  if (filters.serialNum) {
    conditions.push(ilike(consignment.serialNum, `%${filters.serialNum}%`));
  }

  if (filters.block) {
    conditions.push(ilike(consignment.block, `%${filters.block}%`));
  }

  if (filters.itemName) {
    conditions.push(ilike(consignment.itemName, `%${filters.itemName}%`));
  }

  if (filters.itemCode) {
    conditions.push(ilike(consignment.itemCode, `%${filters.itemCode}%`));
  }

  if (filters.slabName) {
    conditions.push(ilike(consignment.slabName, `%${filters.slabName}%`));
  }

  if (filters.isBroken !== undefined) {
    conditions.push(eq(consignment.isBroken, filters.isBroken));
  }

  if (conditions.length > 0) {
    return await db.select().from(consignment).where(and(...conditions));
  }

  return await db.select().from(consignment);
}

// Query own slabs table
export async function queryOwnSlabs(filters: QueryFilters = {}) {
  const conditions = [];

  if (filters.vendorName) {
    conditions.push(ilike(ownSlabs.vendorName, `%${filters.vendorName}%`));
  }

  if (filters.invoiceNumber) {
    conditions.push(ilike(ownSlabs.invoiceNumber, `%${filters.invoiceNumber}%`));
  }

  if (filters.serialNum) {
    conditions.push(ilike(ownSlabs.serialNum, `%${filters.serialNum}%`));
  }

  if (filters.block) {
    conditions.push(ilike(ownSlabs.block, `%${filters.block}%`));
  }

  if (filters.itemName) {
    conditions.push(ilike(ownSlabs.itemName, `%${filters.itemName}%`));
  }

  if (filters.itemCode) {
    conditions.push(ilike(ownSlabs.itemCode, `%${filters.itemCode}%`));
  }

  if (filters.slabName) {
    conditions.push(ilike(ownSlabs.slabName, `%${filters.slabName}%`));
  }

  if (filters.isBroken !== undefined) {
    conditions.push(eq(ownSlabs.isBroken, filters.isBroken));
  }

  if (conditions.length > 0) {
    return await db.select().from(ownSlabs).where(and(...conditions));
  }

  return await db.select().from(ownSlabs);
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
export async function getConsignmentStats() {
  // Get total items count (including broken)
  const totalResult = await db
    .select({
      totalItems: sql<number>`count(*)::int`,
      uniqueVendors: sql<number>`count(distinct ${consignment.vendorName})::int`,
    })
    .from(consignment);

  // Get slab counts (excluding broken)
  const activeResult = await db
    .select({
      totalQuantitySf: sql<number>`coalesce(sum(${consignment.quantitySf}), 0)::numeric`,
      totalQuantitySlabs: sql<number>`coalesce(sum(coalesce(nullif(${consignment.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(consignment)
    .where(eq(consignment.isBroken, false));

  // Get broken slab counts
  const brokenResult = await db
    .select({
      brokenSlabs: sql<number>`coalesce(sum(coalesce(nullif(${consignment.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(consignment)
    .where(eq(consignment.isBroken, true));

  return {
    totalItems: totalResult[0]?.totalItems || 0,
    totalQuantitySf: activeResult[0]?.totalQuantitySf || 0,
    totalQuantitySlabs: activeResult[0]?.totalQuantitySlabs || 0,
    brokenSlabs: brokenResult[0]?.brokenSlabs || 0,
    uniqueVendors: totalResult[0]?.uniqueVendors || 0,
  };
}

// Get own slabs stats (totalItems includes all, slab counts exclude broken)
export async function getOwnSlabsStats() {
  // Get total items count (including broken)
  const totalResult = await db
    .select({
      totalItems: sql<number>`count(*)::int`,
      uniqueVendors: sql<number>`count(distinct ${ownSlabs.vendorName})::int`,
    })
    .from(ownSlabs);

  // Get slab counts (excluding broken)
  const activeResult = await db
    .select({
      totalQuantitySf: sql<number>`coalesce(sum(${ownSlabs.quantitySf}), 0)::numeric`,
      totalQuantitySlabs: sql<number>`coalesce(sum(coalesce(nullif(${ownSlabs.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(ownSlabs)
    .where(eq(ownSlabs.isBroken, false));

  // Get broken slab counts
  const brokenResult = await db
    .select({
      brokenSlabs: sql<number>`coalesce(sum(coalesce(nullif(${ownSlabs.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(ownSlabs)
    .where(eq(ownSlabs.isBroken, true));

  return {
    totalItems: totalResult[0]?.totalItems || 0,
    totalQuantitySf: activeResult[0]?.totalQuantitySf || 0,
    totalQuantitySlabs: activeResult[0]?.totalQuantitySlabs || 0,
    brokenSlabs: brokenResult[0]?.brokenSlabs || 0,
    uniqueVendors: totalResult[0]?.uniqueVendors || 0,
  };
}

// Get combined inventory stats
export async function getInventoryStats() {
  const [consignmentStats, ownSlabsStats] = await Promise.all([
    getConsignmentStats(),
    getOwnSlabsStats(),
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
export async function getConsignmentBySlabName() {
  const result = await db
    .select({
      name: sql<string>`coalesce(${consignment.slabName}, 'Unknown')`,
      value: sql<number>`coalesce(sum(coalesce(nullif(${consignment.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(consignment)
    .where(eq(consignment.isBroken, false))
    .groupBy(consignment.slabName)
    .orderBy(desc(sql`sum(coalesce(nullif(${consignment.quantitySlabs}, 0), 1))`))
    .limit(10);

  return result;
}

// Get own slabs by slab name (excludes broken slabs)
export async function getOwnSlabsBySlabName() {
  const result = await db
    .select({
      name: sql<string>`coalesce(${ownSlabs.slabName}, 'Unknown')`,
      value: sql<number>`coalesce(sum(coalesce(nullif(${ownSlabs.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(ownSlabs)
    .where(eq(ownSlabs.isBroken, false))
    .groupBy(ownSlabs.slabName)
    .orderBy(desc(sql`sum(coalesce(nullif(${ownSlabs.quantitySlabs}, 0), 1))`))
    .limit(10);

  return result;
}

// Get consignment slabs by vendor (excludes broken slabs)
export async function getConsignmentByVendor() {
  const result = await db
    .select({
      name: sql<string>`coalesce(${consignment.vendorName}, 'Unknown')`,
      value: sql<number>`coalesce(sum(coalesce(nullif(${consignment.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(consignment)
    .where(eq(consignment.isBroken, false))
    .groupBy(consignment.vendorName)
    .orderBy(desc(sql`sum(coalesce(nullif(${consignment.quantitySlabs}, 0), 1))`))
    .limit(10);

  return result;
}

// Get own slabs by vendor (excludes broken slabs)
export async function getOwnSlabsByVendor() {
  const result = await db
    .select({
      name: sql<string>`coalesce(${ownSlabs.vendorName}, 'Unknown')`,
      value: sql<number>`coalesce(sum(coalesce(nullif(${ownSlabs.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(ownSlabs)
    .where(eq(ownSlabs.isBroken, false))
    .groupBy(ownSlabs.vendorName)
    .orderBy(desc(sql`sum(coalesce(nullif(${ownSlabs.quantitySlabs}, 0), 1))`))
    .limit(10);

  return result;
}

// Query both tables and return combined results (for search/chat API)
export async function queryInventory(filters: QueryFilters = {}) {
  const result = await queryAllInventory(filters);
  return result.all;
}

// Combined slab count by slab name (from both tables)
export async function getSlabsBySlabName() {
  const [consignmentData, ownSlabsData] = await Promise.all([
    getConsignmentBySlabName(),
    getOwnSlabsBySlabName(),
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
export async function getSlabsByVendor() {
  // Only return consignment vendor data
  return getConsignmentByVendor();
}

// Get unique customer names (transferredTo) from own_slabs
export async function getCustomerNames(): Promise<string[]> {
  const result = await db
    .selectDistinct({ transferredTo: ownSlabs.transferredTo })
    .from(ownSlabs);

  return result
    .map((r) => r.transferredTo)
    .filter((name): name is string => !!name)
    .sort();
}

// Legacy function for backward compatibility
export async function getAllVendors() {
  const [consignmentVendors, ownSlabsVendors] = await Promise.all([
    db.selectDistinct({ vendorName: consignment.vendorName }).from(consignment),
    db.selectDistinct({ vendorName: ownSlabs.vendorName }).from(ownSlabs),
  ]);

  const allVendors = new Set([
    ...consignmentVendors.map(r => r.vendorName),
    ...ownSlabsVendors.map(r => r.vendorName),
  ]);

  return Array.from(allVendors);
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

export async function getVendorDetails(): Promise<VendorDetails[]> {
  // Get vendor info from consignment only (excludes broken slabs)
  const consignmentVendors = await db
    .select({
      vendorName: consignment.vendorName,
      vendorAddress: consignment.vendorAddress,
      vendorPhone: consignment.vendorPhone,
      slabCount: sql<number>`coalesce(sum(coalesce(nullif(${consignment.quantitySlabs}, 0), 1)), 0)::int`,
    })
    .from(consignment)
    .where(eq(consignment.isBroken, false))
    .groupBy(consignment.vendorName, consignment.vendorAddress, consignment.vendorPhone);

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
