import { NextRequest, NextResponse } from "next/server";
import { queryInventory, QueryFilters } from "@/lib/queryHelpers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: QueryFilters = {};
    if (searchParams.get("vendor")) {
      filters.vendorName = searchParams.get("vendor")!;
    }
    if (searchParams.get("invoice")) {
      filters.invoiceNumber = searchParams.get("invoice")!;
    }
    if (searchParams.get("itemName")) {
      filters.itemName = searchParams.get("itemName")!;
    }

    const items = await queryInventory(filters);
    return NextResponse.json(items);
  } catch (error) {
    console.error("Inventory error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
