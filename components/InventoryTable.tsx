"use client";

import { SlabItem } from "@/drizzle/schema";

type InventoryItem = SlabItem & { source?: 'consignment' | 'own_slabs' };

interface InventoryTableProps {
  items: InventoryItem[];
}

export default function InventoryTable({ items }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No inventory items found.
      </div>
    );
  }

  // Helper to get reference number (transfer or invoice)
  const getReferenceNumber = (item: InventoryItem) => {
    if ('transferNumber' in item && item.transferNumber) return item.transferNumber;
    if ('invoiceNumber' in item && item.invoiceNumber) return item.invoiceNumber;
    return "-";
  };

  // Helper to get date (transfer or invoice date)
  const getDate = (item: InventoryItem) => {
    if ('transferDate' in item && item.transferDate) return item.transferDate;
    if ('invoiceDate' in item && item.invoiceDate) return item.invoiceDate;
    return "-";
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Slab Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Item Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Vendor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Reference #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Code
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/50">
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.source === 'consignment'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {item.source === 'consignment' ? 'Consignment' : 'Own'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                {item.slabName || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {item.itemName || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {item.vendorName || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {getReferenceNumber(item)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {item.itemCode || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {item.quantity || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {getDate(item)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
