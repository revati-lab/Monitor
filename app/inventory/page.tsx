import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import RealtimeInventory from "@/components/RealtimeInventory";
import { PageHeader } from "@/components/ui/section-header";
import { db } from "@/lib/db";
import { sales } from "@/drizzle/schema";

async function getInventoryItems(userId: string) {
  try {
    // Fetch from sales table filtered by user and map documentType to source
    const items = await db
      .select()
      .from(sales)
      .where(eq(sales.userId, userId))
      .limit(100);

    // Map documentType to source for backward compatibility with UI components
    const combined = items.map((item) => ({
      ...item,
      source: item.documentType === "transfer-consignment" ? "consignment" as const : "own_slabs" as const,
    }));

    return combined;
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}

export default async function InventoryPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Inventory"
          description="Please sign in to view your inventory"
        />
      </div>
    );
  }

  const items = await getInventoryItems(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Real-time inventory management with live updates"
      />

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <RealtimeInventory initialItems={items} />
      </div>
    </div>
  );
}
