"use client";

import { useRealtimeInventory } from "@/hooks/useRealtimeInventory";
import InventoryTable from "./InventoryTable";
import { SlabItem } from "@/drizzle/schema";

interface RealtimeInventoryProps {
  initialItems: (SlabItem & { source?: 'consignment' | 'own_slabs' })[];
}

export default function RealtimeInventory({
  initialItems,
}: RealtimeInventoryProps) {
  const { items, isConnected, lastUpdate } = useRealtimeInventory(initialItems);

  return (
    <div>
      {/* Connection status indicator */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-success" : "bg-destructive"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? "Live updates enabled" : "Connecting..."}
          </span>
        </div>
        {lastUpdate && (
          <span className="text-sm text-muted-foreground/70">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Item count */}
      <div className="px-4 mb-2">
        <span className="text-sm text-muted-foreground">{items.length} items</span>
      </div>

      {/* Inventory table */}
      <InventoryTable items={items} />
    </div>
  );
}
