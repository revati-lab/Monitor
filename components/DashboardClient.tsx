"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { ActionCard, ActionCardGrid } from "@/components/ui/action-card";
import { PageHeader, SectionHeader } from "@/components/ui/section-header";
import { PieChartCard } from "@/components/ui/pie-chart";
import { VendorStatCard } from "@/components/VendorStatCard";
import { useDashboardStats, DashboardData } from "@/hooks/useDashboardStats";
import { cn } from "@/lib/utils";

type InventoryView = "all" | "consignment" | "own";

interface DashboardClientProps {
  initialData: DashboardData;
  pollingInterval?: number;
}

export function DashboardClient({
  initialData,
  pollingInterval = 10000,
}: DashboardClientProps) {
  const [activeView, setActiveView] = useState<InventoryView>("all");

  const { data, lastUpdate, isPolling } = useDashboardStats(initialData, {
    interval: pollingInterval,
    enabled: true,
  });

  const { stats, slabsByItem, slabsByVendor, consignmentBySlabName, ownSlabsBySlabName, customerNames } = data;

  // Get display name for own slabs section
  const getOwnSlabsDisplayName = () => {
    if (customerNames && customerNames.length > 0) {
      return customerNames.join(", ");
    }
    return "Transferred";
  };

  // Get stats based on active view
  const displayStats = {
    all: {
      totalItems: stats.totalItems,
      totalQuantitySf: stats.totalQuantitySf,
      totalQuantitySlabs: stats.totalQuantitySlabs,
      totalVendors: stats.totalVendors,
    },
    consignment: {
      totalItems: stats.consignment.totalItems,
      totalQuantitySf: stats.consignment.totalQuantitySf,
      totalQuantitySlabs: stats.consignment.totalQuantitySlabs,
      totalVendors: stats.totalVendors,
    },
    own: {
      totalItems: stats.ownSlabs.totalItems,
      totalQuantitySf: stats.ownSlabs.totalQuantitySf,
      totalQuantitySlabs: stats.ownSlabs.totalQuantitySlabs,
      totalVendors: stats.totalVendors,
    },
  }[activeView];

  const viewTabs = [
    { id: "all" as const, label: "All Inventory", color: "bg-primary" },
    { id: "consignment" as const, label: "Consignment", color: "bg-blue-500" },
    { id: "own" as const, label: getOwnSlabsDisplayName(), color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
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

      {/* View Toggle Tabs */}
      <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
        {viewTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all",
              activeView === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  activeView === tab.id ? tab.color : "bg-muted-foreground/30"
                )}
              />
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <section className="space-y-4">
        <SectionHeader
          title={
            activeView === "all"
              ? "Total Inventory"
              : activeView === "consignment"
              ? "Consignment Inventory"
              : `${getOwnSlabsDisplayName()} Inventory`
          }
          description={
            activeView === "all"
              ? "Combined stats from all sources"
              : activeView === "consignment"
              ? "Items received on consignment"
              : `Inventory for ${getOwnSlabsDisplayName()}`
          }
        />
        <StatCardGrid>
          <StatCard
            title="Total Items"
            value={displayStats.totalItems}
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
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            }
            description="Tracked in system"
          />
          <VendorStatCard value={displayStats.totalVendors} />
          <StatCard
            title="Square Feet"
            value={displayStats.totalQuantitySf.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
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
                  d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                />
              </svg>
            }
            description="Total area"
          />
          <StatCard
            title="Slabs"
            value={displayStats.totalQuantitySlabs}
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
            description={displayStats.totalQuantitySlabs === 1 ? "slab" : "slabs total"}
          />
        </StatCardGrid>
      </section>

      {/* Consignment vs Transferred Breakdown - Only show in "all" view */}
      {activeView === "all" && (
        <section className="space-y-4">
          <SectionHeader
            title="Inventory Breakdown"
            description="Comparison between consignment and transferred items"
          />
          <div className="grid gap-6 md:grid-cols-2">
            {/* Consignment Stats */}
            <Card
              className="p-6 cursor-pointer transition-all hover:ring-2 hover:ring-blue-500/50"
              onClick={() => setActiveView("consignment")}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <svg
                    className="h-5 w-5 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-9.75c0-.621-.504-1.125-1.125-1.125H12m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H12m0 0V3.375m0 2.25h9.75"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Consignment</h3>
                  <p className="text-xs text-muted-foreground">
                    Items received on consignment
                  </p>
                </div>
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.consignment.totalItems}
                  </p>
                  <p className="text-xs text-muted-foreground">Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.consignment.totalQuantitySlabs}
                  </p>
                  <p className="text-xs text-muted-foreground">Slabs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.consignment.totalQuantitySf.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">Sq Ft</p>
                </div>
              </div>
            </Card>

            {/* Transferred Stats */}
            <Card
              className="p-6 cursor-pointer transition-all hover:ring-2 hover:ring-emerald-500/50"
              onClick={() => setActiveView("own")}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <svg
                    className="h-5 w-5 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{getOwnSlabsDisplayName()}</h3>
                  <p className="text-xs text-muted-foreground">
                    Transferred inventory
                  </p>
                </div>
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.ownSlabs.totalItems}
                  </p>
                  <p className="text-xs text-muted-foreground">Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.ownSlabs.totalQuantitySlabs}
                  </p>
                  <p className="text-xs text-muted-foreground">Slabs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.ownSlabs.totalQuantitySf.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">Sq Ft</p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Analytics Section with Pie Charts */}
      <section className="space-y-4">
        <SectionHeader
          title="Inventory Analytics"
          description={
            activeView === "all"
              ? "Visual breakdown of your slab inventory"
              : activeView === "consignment"
              ? "Distribution of consignment slabs"
              : `Distribution of ${getOwnSlabsDisplayName()} slabs`
          }
        />
        {activeView === "all" && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <PieChartCard
                data={slabsByItem}
                title="All Slabs by Type"
                description="Combined distribution across all inventory"
                emptyMessage="No slab data available"
              />
              <PieChartCard
                data={slabsByVendor}
                title="Slabs by Vendor (Consignment)"
                description="Distribution across consignment vendors"
                emptyMessage="No vendor data available"
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <PieChartCard
                data={consignmentBySlabName}
                title="Consignment by Type"
                description="Distribution of consignment slabs by type"
                emptyMessage="No consignment data"
              />
              <PieChartCard
                data={ownSlabsBySlabName}
                title={`${getOwnSlabsDisplayName()} Slabs by Type`}
                description={`Distribution of ${getOwnSlabsDisplayName()} slabs by type`}
                emptyMessage="No data"
              />
            </div>
          </>
        )}
        {activeView === "consignment" && (
          <div className="grid gap-6 md:grid-cols-2">
            <PieChartCard
              data={consignmentBySlabName}
              title="Consignment by Type"
              description="Distribution of consignment slabs by type"
              emptyMessage="No consignment data"
            />
            <PieChartCard
              data={slabsByVendor}
              title="Consignment by Vendor"
              description="Distribution across vendors"
              emptyMessage="No vendor data available"
            />
          </div>
        )}
        {activeView === "own" && (
          <div className="grid gap-6 md:grid-cols-2">
            <PieChartCard
              data={ownSlabsBySlabName}
              title={`${getOwnSlabsDisplayName()} Slabs by Type`}
              description={`Distribution of ${getOwnSlabsDisplayName()} slabs by type`}
              emptyMessage="No data"
            />
            <PieChartCard
              data={slabsByVendor}
              title={`${getOwnSlabsDisplayName()} by Vendor`}
              description="Distribution across vendors"
              emptyMessage="No vendor data available"
            />
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="space-y-4">
        <SectionHeader
          title="Quick Actions"
          description="Navigate to common tasks"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/inventory">
                View all inventory
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </Button>
          }
        />
        <ActionCardGrid>
          <ActionCard
            href="/upload"
            variant="highlighted"
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
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            }
            title="Upload Files"
            description="Upload packing lists and invoices for automatic data extraction"
            badge="Popular"
          />
          <ActionCard
            href="/search"
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
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                />
              </svg>
            }
            title="Search"
            description="Query your inventory using natural language"
          />
          <ActionCard
            href="/inventory"
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
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"
                />
              </svg>
            }
            title="View Inventory"
            description="Browse and manage all inventory items"
          />
        </ActionCardGrid>
      </section>

      {/* Getting Started (conditional for empty state) */}
      {stats.totalItems === 0 && (
        <section className="space-y-4">
          <Card variant="gradient" className="overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <svg
                    className="h-8 w-8 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                    />
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-semibold">
                    Get started with automatic extraction
                  </h3>
                  <p className="text-muted-foreground">
                    Upload your first packing list and watch our system
                    automatically extract inventory data. It&apos;s fast,
                    accurate, and saves hours of manual entry.
                  </p>
                </div>
                <Button variant="gradient" size="lg" asChild className="shrink-0">
                  <Link href="/upload">
                    Upload your first file
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
