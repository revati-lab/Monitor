import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

interface ToggleBrokenRequest {
  id: string;
  type: "consignment" | "own_slabs";
  isBroken: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ToggleBrokenRequest = await request.json();
    const { id, type, isBroken } = body;

    if (!id || !type) {
      return NextResponse.json(
        { error: "Missing required fields: id and type" },
        { status: 400 }
      );
    }

    if (type !== "consignment" && type !== "own_slabs") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'consignment' or 'own_slabs'" },
        { status: 400 }
      );
    }

    // Update the sales table - the type is used for validation but all records are in one table now
    await db
      .update(sales)
      .set({ isBroken })
      .where(eq(sales.id, id));

    return NextResponse.json({ success: true, id, type, isBroken });
  } catch (error) {
    console.error("Toggle broken error:", error);
    return NextResponse.json(
      { error: "Failed to update broken status" },
      { status: 500 }
    );
  }
}
