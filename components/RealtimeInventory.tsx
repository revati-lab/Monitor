"use client";

import { useState, useMemo, useCallback } from "react";
import { useRealtimeInventory } from "@/hooks/useRealtimeInventory";
import InventoryTable from "./InventoryTable";
import { SlabItem } from "@/drizzle/schema";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface RealtimeInventoryProps {
  initialItems: (SlabItem & { source?: "consignment" | "own_slabs" })[];
}

export default function RealtimeInventory({
  initialItems,
}: RealtimeInventoryProps) {
  const router = useRouter();
  const { items, isConnected, lastUpdate, updateItem } = useRealtimeInventory(initialItems);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Handle broken status change - update local state and refresh server data
  const handleBrokenChange = useCallback((id: string, isBroken: boolean) => {
    updateItem(id, { isBroken });
    // Refresh the page data to ensure dashboard counts are updated on next visit
    router.refresh();
  }, [updateItem, router]);

  // Get unique vendor names (from consignment items)
  const vendorNames = useMemo(() => {
    const names = new Set<string>();
    items
      .filter((item) => item.source === "consignment")
      .forEach((item) => {
        if (item.vendorName) names.add(item.vendorName);
      });
    return Array.from(names).sort();
  }, [items]);

  // Get unique transferredTo names (from own_slabs items)
  const customerNames = useMemo(() => {
    const names = new Set<string>();
    items
      .filter((item) => item.source === "own_slabs")
      .forEach((item) => {
        if (item.transferredTo) names.add(item.transferredTo);
      });
    return Array.from(names).sort();
  }, [items]);

  // Calculate counts
  // "All" shows total items, other tabs exclude broken items
  const getCounts = useMemo(() => {
    const nonBrokenItems = items.filter((item) => !item.isBroken);
    const counts: Record<string, number> = {
      all: items.length,  // All includes everything
      allActive: nonBrokenItems.length,  // For reference
    };

    // Count by vendor name (excluding broken for meaningful count)
    vendorNames.forEach((name) => {
      counts[`vendor:${name}`] = nonBrokenItems.filter(
        (item) => item.source === "consignment" && item.vendorName === name
      ).length;
    });

    // Count by customer name (excluding broken for meaningful count)
    customerNames.forEach((name) => {
      counts[`customer:${name}`] = nonBrokenItems.filter(
        (item) => item.source === "own_slabs" && item.transferredTo === name
      ).length;
    });

    return counts;
  }, [items, vendorNames, customerNames]);

  // Filter items based on active tab and search query
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by tab
    if (activeTab !== "all") {
      if (activeTab.startsWith("vendor:")) {
        const vendorName = activeTab.replace("vendor:", "");
        result = result.filter(
          (item) => item.source === "consignment" && item.vendorName === vendorName
        );
      } else if (activeTab.startsWith("customer:")) {
        const customerName = activeTab.replace("customer:", "");
        result = result.filter(
          (item) => item.source === "own_slabs" && item.transferredTo === customerName
        );
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.slabName?.toLowerCase().includes(query) ||
          item.itemName?.toLowerCase().includes(query) ||
          item.vendorName?.toLowerCase().includes(query) ||
          item.transferredTo?.toLowerCase().includes(query) ||
          item.itemCode?.toLowerCase().includes(query)
      );
    }

    // Sort: consignment first (alphabetically), then own_slabs (alphabetically)
    return [...result].sort((a, b) => {
      // First sort by source type (consignment first)
      if (a.source !== b.source) {
        return a.source === "consignment" ? -1 : 1;
      }
      // Then sort alphabetically by slab name within each group
      return (a.slabName || "").localeCompare(b.slabName || "");
    });
  }, [items, activeTab, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header with connection status and search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 pt-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
              isConnected
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
            )}
          >
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  isConnected ? "bg-green-500" : "bg-yellow-500"
                )}
              ></span>
            </span>
            {isConnected ? "Live" : "Connecting..."}
          </div>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Compact Filter Tabs */}
      <div className="px-4">
        <div className="flex flex-wrap gap-2">
          {/* All Tab */}
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              activeTab === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            All
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              activeTab === "all" ? "bg-primary-foreground/20" : "bg-background"
            )}>
              {getCounts.all}
            </span>
          </button>

          {/* Vendor Names (Consignment) */}
          {vendorNames.map((name) => (
            <button
              key={`vendor:${name}`}
              onClick={() => setActiveTab(`vendor:${name}`)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                activeTab === `vendor:${name}`
                  ? "bg-blue-500 text-white"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
              )}
            >
              {name}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                activeTab === `vendor:${name}` ? "bg-white/30" : "bg-blue-500/20"
              )}>
                Consignment
              </span>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                activeTab === `vendor:${name}` ? "bg-white/20" : "bg-blue-500/10"
              )}>
                {getCounts[`vendor:${name}`]}
              </span>
            </button>
          ))}

          {/* Other Names */}
          {customerNames.map((name) => (
            <button
              key={`customer:${name}`}
              onClick={() => setActiveTab(`customer:${name}`)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                activeTab === `customer:${name}`
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
              )}
            >
              {name}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                activeTab === `customer:${name}` ? "bg-white/20" : "bg-emerald-500/10"
              )}>
                {getCounts[`customer:${name}`]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Results info */}
      {searchQuery && (
        <div className="px-4">
          <p className="text-sm text-muted-foreground">
            Found {filteredItems.length} item
            {filteredItems.length !== 1 ? "s" : ""} matching &quot;{searchQuery}
            &quot;
          </p>
        </div>
      )}

      {/* Compact Stats */}
      <div className="flex items-center gap-4 px-4 text-sm flex-wrap">
        <span className="text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredItems.length}</span> items
        </span>
        {vendorNames.length > 0 && (
          <span className="text-muted-foreground">
            <span className="font-semibold text-blue-600 dark:text-blue-400">{vendorNames.length}</span> consignment
          </span>
        )}
        {customerNames.length > 0 && (
          <span className="text-muted-foreground">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{customerNames.join(", ")}</span>
          </span>
        )}
        {items.filter(i => i.isBroken).length > 0 && (
          <span className="text-muted-foreground">
            <span className="font-semibold text-red-600 dark:text-red-400">{items.filter(i => i.isBroken).length}</span> broken
          </span>
        )}
      </div>

      {/* Inventory table */}
      <div className="border-t border-border">
        <InventoryTable
          items={filteredItems}
          activeTab={activeTab}
          onBrokenChange={handleBrokenChange}
        />
      </div>
    </div>
  );
}
