import InventoryTable from "@/components/InventoryTable";
import { db } from "@/lib/db";
import { inventoryItems } from "@/drizzle/schema";

async function getInventoryItems() {
  try {
    const items = await db.select().from(inventoryItems).limit(100);
    return items;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory</h1>
        <p className="text-gray-600">
          View all inventory items ({items.length} items)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <InventoryTable items={items} />
      </div>
    </div>
  );
}
