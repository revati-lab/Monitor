import { NextResponse } from "next/server";
import { getInventoryStats, getAllVendors } from "@/lib/queryHelpers";

export async function GET() {
  try {
    const stats = await getInventoryStats();
    const vendors = await getAllVendors();
    
    return NextResponse.json({
      totalItems: stats.totalItems,
      totalVendors: stats.uniqueVendors,
      totalQuantitySf: Number(stats.totalQuantitySf) || 0,
      totalQuantitySlabs: stats.totalQuantitySlabs || 0,
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
