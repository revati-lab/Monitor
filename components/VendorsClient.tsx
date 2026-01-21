"use client";

import { useState } from "react";
import { PageHeader, SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/card";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { VendorDetails } from "@/lib/queryHelpers";
import { usePolling } from "@/hooks/usePolling";

interface VendorsClientProps {
  initialVendors: VendorDetails[];
}

async function fetchVendors(): Promise<VendorDetails[]> {
  const response = await fetch("/api/vendors");
  if (!response.ok) {
    throw new Error("Failed to fetch vendors");
  }
  return response.json();
}

export function VendorsClient({ initialVendors }: VendorsClientProps) {
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: vendors, lastUpdate, isPolling } = usePolling(
    fetchVendors,
    initialVendors,
    { interval: 10000, enabled: true }
  );

  // Calculate stats
  const totalSlabs = vendors.reduce((sum, v) => sum + v.slabCount, 0);

  // Filter vendors based on search
  const filteredVendors = vendors.filter((vendor) =>
    vendor.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Vendors"
        description={`${vendors.length} vendor${vendors.length !== 1 ? "s" : ""} in your inventory`}
        badge={
          isPolling && lastUpdate ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-full bg-green-500/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live
            </span>
          ) : undefined
        }
      />

      {/* Stats Overview */}
      <section className="space-y-4">
        <SectionHeader title="Overview" />
        <StatCardGrid>
          <StatCard
            title="Consignment Vendors"
            value={vendors.length}
            variant="gradient"
            icon={
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            }
            description="Active consignment vendors"
          />
          <StatCard
            title="Total Slabs"
            value={totalSlabs}
            icon={
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"
                />
              </svg>
            }
            description="Consignment slabs"
          />
        </StatCardGrid>
      </section>

      {/* Vendor List */}
      <section className="space-y-4">
        <SectionHeader
          title="All Vendors"
          description="Click on a vendor to see details"
        />

        {/* Search */}
        <div className="relative">
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
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Vendor Cards */}
        <div className="space-y-2">
          {filteredVendors.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No vendors found matching your search"
                  : "No vendors in your inventory yet"}
              </p>
            </Card>
          ) : (
            filteredVendors.map((vendor) => (
              <div
                key={vendor.vendorName}
                className="group rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() =>
                  setExpandedVendor(
                    expandedVendor === vendor.vendorName
                      ? null
                      : vendor.vendorName
                  )
                }
              >
                {/* Vendor Header Row */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {vendor.vendorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {vendor.vendorName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          Consignment
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {vendor.slabCount}
                      </p>
                      <p className="text-xs text-muted-foreground">slabs</p>
                    </div>
                    <svg
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
                        expandedVendor === vendor.vendorName ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedVendor === vendor.vendorName && (
                  <div className="border-t border-border bg-muted/30 p-4 space-y-3">
                    {vendor.vendorAddress && (
                      <div className="flex items-start gap-3">
                        <svg
                          className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                          />
                        </svg>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Address
                          </p>
                          <p className="text-sm text-foreground">
                            {vendor.vendorAddress}
                          </p>
                        </div>
                      </div>
                    )}

                    {vendor.vendorPhone && (
                      <div className="flex items-start gap-3">
                        <svg
                          className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                          />
                        </svg>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Phone
                          </p>
                          <p className="text-sm text-foreground">
                            {vendor.vendorPhone}
                          </p>
                        </div>
                      </div>
                    )}

                    {vendor.vendorEmail && (
                      <div className="flex items-start gap-3">
                        <svg
                          className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                          />
                        </svg>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Email
                          </p>
                          <p className="text-sm text-foreground">
                            {vendor.vendorEmail}
                          </p>
                        </div>
                      </div>
                    )}

                    {!vendor.vendorAddress &&
                      !vendor.vendorPhone &&
                      !vendor.vendorEmail && (
                        <p className="text-sm text-muted-foreground italic">
                          No contact information available
                        </p>
                      )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
