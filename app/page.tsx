import { auth } from "@clerk/nextjs/server";
import {
  getInventoryStats,
  getSlabsBySlabName,
  getSlabsByVendor,
  getConsignmentBySlabName,
  getOwnSlabsBySlabName,
  getVendorDetails,
  getCustomerNames,
} from "@/lib/queryHelpers";
import { DashboardClient } from "@/components/DashboardClient";
import { DashboardData } from "@/hooks/useDashboardStats";

export default async function HomePage() {
  const { userId } = await auth();
  let initialData: DashboardData = {
    stats: {
      totalItems: 0,
      totalVendors: 0,
      totalQuantitySf: 0,
      totalQuantitySlabs: 0,
      brokenSlabs: 0,
      consignment: { totalItems: 0, totalQuantitySf: 0, totalQuantitySlabs: 0, brokenSlabs: 0 },
      ownSlabs: { totalItems: 0, totalQuantitySf: 0, totalQuantitySlabs: 0, brokenSlabs: 0 },
    },
    slabsByItem: [],
    slabsByVendor: [],
    consignmentBySlabName: [],
    ownSlabsBySlabName: [],
    vendorDetails: [],
    customerNames: [],
  };

  try {
    const [dbStats, slabData, vendorData, consignmentSlabs, ownSlabs, vendors, customerNames] =
      await Promise.all([
        getInventoryStats(userId || undefined),
        getSlabsBySlabName(userId || undefined),
        getSlabsByVendor(userId || undefined),
        getConsignmentBySlabName(userId || undefined),
        getOwnSlabsBySlabName(userId || undefined),
        getVendorDetails(userId || undefined),
        getCustomerNames(userId || undefined),
      ]);

    initialData = {
      stats: {
        totalItems: dbStats.total.totalItems,
        totalVendors: dbStats.total.uniqueVendors,
        totalQuantitySf: Number(dbStats.total.totalQuantitySf) || 0,
        totalQuantitySlabs: dbStats.total.totalQuantitySlabs || 0,
        brokenSlabs: dbStats.total.brokenSlabs || 0,
        consignment: {
          totalItems: dbStats.consignment.totalItems,
          totalQuantitySf: Number(dbStats.consignment.totalQuantitySf) || 0,
          totalQuantitySlabs: dbStats.consignment.totalQuantitySlabs || 0,
          brokenSlabs: dbStats.consignment.brokenSlabs || 0,
        },
        ownSlabs: {
          totalItems: dbStats.ownSlabs.totalItems,
          totalQuantitySf: Number(dbStats.ownSlabs.totalQuantitySf) || 0,
          totalQuantitySlabs: dbStats.ownSlabs.totalQuantitySlabs || 0,
          brokenSlabs: dbStats.ownSlabs.brokenSlabs || 0,
        },
      },
      slabsByItem: slabData.map((item) => ({
        name: item.name || "Unknown",
        value: Number(item.value) || 0,
      })),
      slabsByVendor: vendorData.map((item) => ({
        name: item.name || "Unknown",
        value: Number(item.value) || 0,
      })),
      consignmentBySlabName: consignmentSlabs.map((item) => ({
        name: item.name || "Unknown",
        value: Number(item.value) || 0,
      })),
      ownSlabsBySlabName: ownSlabs.map((item) => ({
        name: item.name || "Unknown",
        value: Number(item.value) || 0,
      })),
      vendorDetails: vendors.map((v) => ({
        vendorName: v.vendorName,
        slabCount: v.slabCount,
        totalSf: 0,
      })),
      customerNames,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
  }

  return (
    <DashboardClient
      initialData={initialData}
      pollingInterval={10000}
    />
  );
}
