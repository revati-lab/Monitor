"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ExtractedItem {
  itemCode?: string;
  itemName?: string;
  slabName?: string;
  serialNum?: string;
  barcode?: string;
  bundle?: string;
  slabNumber?: string;
  block?: string;
  bin?: string;
  quantity?: string;
  quantitySf?: number;
  quantitySlabs?: number;
  unitPrice?: number;
  totalPrice?: number;
}

interface ExtractedData {
  transferNumber?: string;
  transferDate?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  purchaseDate?: string;
  vendorName?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  vendorFax?: string;
  transferredTo?: string;
  destinationAddress?: string;
  destinationPhone?: string;
  destinationEmail?: string;
  reqShipDate?: string;
  deliveryMethod?: string;
  shipmentTerms?: string;
  freightCarrier?: string;
  weight?: string;
  items: ExtractedItem[];
}

interface ExtractedDataPreviewProps {
  data: ExtractedData;
  fileName: string;
  fileUrl: string;
  fileType: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ExtractedDataPreview({
  data,
  fileName,
  fileUrl,
  fileType,
  onConfirm,
  onCancel,
}: ExtractedDataPreviewProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Determine if this is consignment or customer
  const isConsignment = !!data.transferNumber;
  const targetTable = isConsignment ? "Consignment" : "Customer";

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await onConfirm();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with target table indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Review Extracted Data</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Please review the data below before saving to the database
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            isConsignment
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {targetTable}
        </span>
      </div>

      {/* Document Info */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Document Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">File Name</p>
            <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
          </div>
          {isConsignment ? (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Transfer Number</p>
                <p className="text-sm font-medium text-foreground">
                  {data.transferNumber || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transfer Date</p>
                <p className="text-sm font-medium text-foreground">
                  {data.transferDate || "-"}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Invoice Number</p>
                <p className="text-sm font-medium text-foreground">
                  {data.invoiceNumber || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Invoice Date</p>
                <p className="text-sm font-medium text-foreground">
                  {data.invoiceDate || "-"}
                </p>
              </div>
            </>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Vendor</p>
            <p className="text-sm font-medium text-foreground">{data.vendorName || "-"}</p>
          </div>
        </div>

        {/* Vendor Details */}
        {(data.vendorAddress || data.vendorPhone) && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.vendorAddress && (
                <div>
                  <p className="text-xs text-muted-foreground">Vendor Address</p>
                  <p className="text-sm text-foreground">{data.vendorAddress}</p>
                </div>
              )}
              {data.vendorPhone && (
                <div>
                  <p className="text-xs text-muted-foreground">Vendor Phone</p>
                  <p className="text-sm text-foreground">{data.vendorPhone}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Items Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Extracted Items ({data.items.length})
          </h3>
          {data.items.length > 15 && (
            <span className="text-xs text-muted-foreground">
              Scroll to see all items
            </span>
          )}
        </div>

        {data.items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No items were extracted from this document.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className={data.items.length > 15 ? "max-h-[600px] overflow-y-auto" : ""}>
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
                      Slab Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
                      Serial #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
                      Block
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
                      Bundle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
                      Qty (SF)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
                      Slabs
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
                      Item Code
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {data.items.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                        {item.slabName || item.itemName || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                        {item.serialNum || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {item.block || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {item.bundle || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {item.quantitySf || item.quantity || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {item.quantitySlabs || 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {item.itemCode || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {data.items.length > 0 && (
          <div className="p-4 bg-muted/30 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Total: {data.items.length} item(s)
              </span>
              <span className="text-muted-foreground">
                Total SF:{" "}
                {data.items
                  .reduce((sum, item) => sum + (item.quantitySf || 0), 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <svg
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={handleConfirm}
          disabled={isSaving || data.items.length === 0}
          className="bg-success hover:bg-success/90 text-success-foreground"
        >
          {isSaving ? (
            <>
              <svg
                className="animate-spin h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Confirm & Save to Database
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
