import { NextResponse } from "next/server";
import { getInventoryStats, getAllVendors } from "@/lib/queryHelpers";

export async function GET() {
  try {
    const stats = await getInventoryStats();
    const vendors = await getAllVendors();

    return NextResponse.json({
      totalItems: stats.total.totalItems,
      totalVendors: stats.total.uniqueVendors,
      totalQuantitySf: Number(stats.total.totalQuantitySf) || 0,
      totalQuantitySlabs: stats.total.totalQuantitySlabs || 0,
      consignment: stats.consignment,
      ownSlabs: stats.ownSlabs,
      vendors,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
