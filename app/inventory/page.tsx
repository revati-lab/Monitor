import RealtimeInventory from "@/components/RealtimeInventory";
import { db } from "@/lib/db";
import { consignment, ownSlabs } from "@/drizzle/schema";

async function getInventoryItems() {
  try {
    // Fetch from both tables and combine
    const [consignmentItems, ownSlabItems] = await Promise.all([
      db.select().from(consignment).limit(50),
      db.select().from(ownSlabs).limit(50),
    ]);

    // Add source indicator and combine
    const combined = [
      ...consignmentItems.map(item => ({ ...item, source: 'consignment' as const })),
      ...ownSlabItems.map(item => ({ ...item, source: 'own_slabs' as const })),
    ];

    return combined;
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}

export default async function InventoryPage() {
  const items = await getInventoryItems();

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Inventory</h1>
        <p className="text-muted-foreground">Real-time inventory management</p>
      </div>

      <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
        <RealtimeInventory initialItems={items} />
      </div>
    </div>
  );
}
