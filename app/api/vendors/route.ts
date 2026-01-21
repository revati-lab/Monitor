import { NextResponse } from "next/server";
import { getVendorDetails } from "@/lib/queryHelpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const vendors = await getVendorDetails();
    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Vendors API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
