import { NextResponse } from "next/server";
import {
  getInventoryStats,
  getSlabsBySlabName,
  getSlabsByVendor,
  getConsignmentBySlabName,
  getOwnSlabsBySlabName,
  getVendorDetails,
  getCustomerNames,
} from "@/lib/queryHelpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [dbStats, slabData, vendorData, consignmentSlabs, ownSlabs, vendors, customerNames] =
      await Promise.all([
        getInventoryStats(),
        getSlabsBySlabName(),
        getSlabsByVendor(),
        getConsignmentBySlabName(),
        getOwnSlabsBySlabName(),
        getVendorDetails(),
        getCustomerNames(),
      ]);

    const stats = {
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
    };

    const slabsByItem = slabData.map((item) => ({
      name: item.name || "Unknown",
      value: Number(item.value) || 0,
    }));

    const slabsByVendor = vendorData.map((item) => ({
      name: item.name || "Unknown",
      value: Number(item.value) || 0,
    }));

    const consignmentBySlabName = consignmentSlabs.map((item) => ({
      name: item.name || "Unknown",
      value: Number(item.value) || 0,
    }));

    const ownSlabsBySlabName = ownSlabs.map((item) => ({
      name: item.name || "Unknown",
      value: Number(item.value) || 0,
    }));

    const vendorDetails = vendors.map((v) => ({
      vendorName: v.vendorName,
      slabCount: v.slabCount,
      totalSf: 0, // Could be calculated if needed
    }));

    return NextResponse.json({
      stats,
      slabsByItem,
      slabsByVendor,
      consignmentBySlabName,
      ownSlabsBySlabName,
      vendorDetails,
      customerNames,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
