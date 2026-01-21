"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VendorDetails } from "@/lib/queryHelpers";

interface VendorListDialogProps {
  vendors: VendorDetails[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorListDialog({ vendors, open, onOpenChange }: VendorListDialogProps) {
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>All Vendors</DialogTitle>
          <DialogDescription>
            {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} in your inventory. Click on a vendor to see details.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          <div className="space-y-2">
            {vendors.map((vendor) => (
              <div
                key={vendor.vendorName}
                className="group rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setExpandedVendor(
                  expandedVendor === vendor.vendorName ? null : vendor.vendorName
                )}
              >
                {/* Vendor Header Row */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {vendor.vendorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{vendor.vendorName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          vendor.source === 'consignment'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : vendor.source === 'own_slabs'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        }`}>
                          {vendor.source === 'consignment' ? 'Consignment' :
                           vendor.source === 'own_slabs' ? 'Customer' : 'Both'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{vendor.slabCount}</p>
                      <p className="text-xs text-muted-foreground">slabs</p>
                    </div>
                    <svg
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
                        expandedVendor === vendor.vendorName ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedVendor === vendor.vendorName && (
                  <div className="border-t border-border bg-muted/30 p-4 space-y-3">
                    {vendor.vendorAddress && (
                      <div className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</p>
                          <p className="text-sm text-foreground">{vendor.vendorAddress}</p>
                        </div>
                      </div>
                    )}

                    {vendor.vendorPhone && (
                      <div className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</p>
                          <p className="text-sm text-foreground">{vendor.vendorPhone}</p>
                        </div>
                      </div>
                    )}

                    {vendor.vendorEmail && (
                      <div className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                          <p className="text-sm text-foreground">{vendor.vendorEmail}</p>
                        </div>
                      </div>
                    )}

                    {!vendor.vendorAddress && !vendor.vendorPhone && !vendor.vendorEmail && (
                      <p className="text-sm text-muted-foreground italic">No contact information available</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Clickable stat card component for vendors
interface ClickableVendorStatProps {
  value: number;
  vendors: VendorDetails[];
}

export function ClickableVendorStat({ value, vendors }: ClickableVendorStatProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="group flex items-center gap-2 text-3xl font-bold tracking-tight text-primary hover:text-primary/80 transition-colors cursor-pointer"
      >
        <span className="underline underline-offset-4 decoration-2 decoration-primary/50 group-hover:decoration-primary">
          {value.toLocaleString()}
        </span>
        <svg
          className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </button>
      <VendorListDialog
        vendors={vendors}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
