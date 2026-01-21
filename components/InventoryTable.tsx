"use client";

import { useState } from "react";
import { SlabItem } from "@/drizzle/schema";
import { cn } from "@/lib/utils";

type InventoryItem = SlabItem & { source?: "consignment" | "own_slabs" };

interface InventoryTableProps {
  items: InventoryItem[];
  activeTab?: string;
}

export default function InventoryTable({
  items,
  activeTab = "all",
}: InventoryTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = items.find((item) => item.id === selectedId);

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <svg
          className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
        <p className="font-medium">No inventory items</p>
        <p className="text-sm mt-1 text-muted-foreground/70">Upload files to get started</p>
      </div>
    );
  }

  const isAllView = activeTab === "all";

  // Helper functions
  const getRefNumber = (item: InventoryItem) => {
    if ("transferNumber" in item && item.transferNumber) return item.transferNumber;
    if ("invoiceNumber" in item && item.invoiceNumber) return item.invoiceNumber;
    return "-";
  };

  const getDate = (item: InventoryItem) => {
    if ("transferDate" in item && item.transferDate) return item.transferDate;
    if ("invoiceDate" in item && item.invoiceDate) return item.invoiceDate;
    return "-";
  };

  return (
    <div className="flex flex-col lg:flex-row lg:h-[600px]">
      {/* List View */}
      <div className={cn("flex-1 divide-y divide-border/50 overflow-y-auto", selectedId && "lg:border-r lg:border-border/50")}>
        {items.map((item) => {
          const isConsignment = item.source === "consignment";
          const isSelected = selectedId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedId(isSelected ? null : item.id)}
              className={cn(
                "flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors",
                isSelected
                  ? "bg-primary/5"
                  : "hover:bg-muted/50"
              )}
            >
              {/* Color indicator */}
              <div
                className={cn(
                  "w-1 h-10 rounded-full shrink-0",
                  isConsignment ? "bg-blue-500" : "bg-emerald-500"
                )}
              />

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {item.slabName || "Unknown"}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {isConsignment
                    ? `${item.vendorName || "Unknown"} • Consignment`
                    : item.transferredTo || "-"}
                </p>
              </div>

              {/* Quantity */}
              <div className="text-right shrink-0">
                <p className="font-semibold text-foreground">{item.quantity || "-"}</p>
                <p className="text-xs text-muted-foreground">{getDate(item)}</p>
              </div>

              {/* Arrow */}
              <svg
                className={cn(
                  "w-4 h-4 text-muted-foreground/50 shrink-0 transition-transform",
                  isSelected && "rotate-90"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div className="lg:w-80 xl:w-96 bg-muted/30 p-5 border-t lg:border-t-0 border-border/50 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Details</h3>
            <button
              onClick={() => setSelectedId(null)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Slab Name */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Slab Name</p>
              <p className="font-medium text-foreground">{selectedItem.slabName || "-"}</p>
            </div>

            {/* Type Badge */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Type</p>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium",
                  selectedItem.source === "consignment"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    selectedItem.source === "consignment" ? "bg-blue-500" : "bg-emerald-500"
                  )}
                />
                {selectedItem.source === "consignment" ? "Consignment" : "Transferred"}
              </span>
            </div>

            <div className="h-px bg-border/50" />

            {/* Grid of details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  {selectedItem.source === "consignment" ? "Transfer #" : "Invoice #"}
                </p>
                <p className="text-sm font-medium text-foreground">{getRefNumber(selectedItem)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Quantity</p>
                <p className="text-sm font-medium text-foreground">{selectedItem.quantity || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date</p>
                <p className="text-sm font-medium text-foreground">{getDate(selectedItem)}</p>
              </div>
              {selectedItem.serialNum && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Serial #</p>
                  <p className="text-sm font-medium text-foreground font-mono">{selectedItem.serialNum}</p>
                </div>
              )}
            </div>

            <div className="h-px bg-border/50" />

            {/* Source Info */}
            {selectedItem.source === "consignment" ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Vendor</p>
                  <p className="text-sm font-medium text-foreground">{selectedItem.vendorName || "-"}</p>
                </div>
                {selectedItem.vendorAddress && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Address</p>
                    <p className="text-sm text-foreground">{selectedItem.vendorAddress}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Transferred To</p>
                  <p className="text-sm font-medium text-foreground">{selectedItem.transferredTo || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Transferred From</p>
                  <p className="text-sm font-medium text-foreground">{selectedItem.vendorName || "-"}</p>
                </div>
                {(selectedItem.destinationAddress || selectedItem.vendorAddress) && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Location</p>
                    <p className="text-sm text-foreground">
                      {selectedItem.destinationAddress || selectedItem.vendorAddress}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Additional details */}
            {(selectedItem.block || selectedItem.bundle) && (
              <>
                <div className="h-px bg-border/50" />
                <div className="grid grid-cols-2 gap-4">
                  {selectedItem.block && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Block</p>
                      <p className="text-sm font-medium text-foreground">{selectedItem.block}</p>
                    </div>
                  )}
                  {selectedItem.bundle && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Bundle</p>
                      <p className="text-sm font-medium text-foreground">{selectedItem.bundle}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
